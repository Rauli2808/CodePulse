import type {
  ApiEnvelope,
  CodeforcesUser,
  Contest,
  RatingChange,
  Submission,
  UserStats,
} from "../types/codeforces";
import { deriveUserStats } from "../utils/userStats";
import { CodeforcesApiError } from "./codeforcesErrors";

const API_ROOT = "https://codeforces.com/api";
const REQUEST_INTERVAL_MS = 2_100;
const USER_CACHE_MS = 15 * 60_000;
const CONTEST_CACHE_MS = 2 * 60_000;
const SUBMISSION_PAGE_SIZE = 10_000;
const SUBMISSION_HISTORY_LIMIT = 100_000;

type CacheEntry<T> = { expiresAt: number; value: T };
type SubmissionHistory = { submissions: Submission[]; complete: boolean };

const cache = new Map<string, CacheEntry<unknown>>();
let requestQueue: Promise<void> = Promise.resolve();
let nextAllowedRequest = 0;

function delay(milliseconds: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T, ttl: number) {
  cache.set(key, { expiresAt: Date.now() + ttl, value });
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.status === "OK" || candidate.status === "FAILED";
}

function classifyFailure(message: string, status: number, handle?: string) {
  if (status === 429 || /limit exceeded|too many requests/i.test(message)) {
    return new CodeforcesApiError(
      "RATE_LIMITED",
      "Codeforces is receiving too many requests. Please wait a moment and try again.",
      handle,
    );
  }
  if (/not found|should contain.*handle|handle.*not exist/i.test(message)) {
    return new CodeforcesApiError(
      "USER_NOT_FOUND",
      handle ? `The Codeforces handle “${handle}” was not found.` : "That Codeforces handle was not found.",
      handle,
    );
  }
  if (status >= 500) {
    return new CodeforcesApiError(
      "SERVICE_UNAVAILABLE",
      "Codeforces is temporarily unavailable. Please try again shortly.",
      handle,
    );
  }
  return new CodeforcesApiError(
    "SERVICE_UNAVAILABLE",
    "Codeforces could not complete this request. Please try again.",
    handle,
  );
}

async function requestCodeforces<T>(
  method: string,
  params: Record<string, string> = {},
  handle?: string,
) {
  let resolveRequest!: (value: T) => void;
  let rejectRequest!: (reason?: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });

  requestQueue = requestQueue.then(async () => {
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const waitingTime = Math.max(0, nextAllowedRequest - Date.now());
        if (waitingTime) await delay(waitingTime);
        nextAllowedRequest = Date.now() + REQUEST_INTERVAL_MS;

        const url = new URL(`${API_ROOT}/${method}`);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

        let response: Response;
        try {
          response = await fetch(url, { headers: { Accept: "application/json" } });
        } catch {
          throw new CodeforcesApiError(
            "NETWORK",
            "Could not reach Codeforces. Check your connection and try again.",
            handle,
          );
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new CodeforcesApiError(
            "MALFORMED_RESPONSE",
            "Codeforces returned an unreadable response. Please try again shortly.",
            handle,
          );
        }

        if (!isApiEnvelope(payload)) {
          throw new CodeforcesApiError(
            "MALFORMED_RESPONSE",
            "Codeforces returned an unexpected response. Please try again shortly.",
            handle,
          );
        }

        if (response.ok && payload.status === "OK" && payload.result !== undefined) {
          resolveRequest(payload.result as T);
          return;
        }

        const message = payload.comment || `Codeforces returned HTTP ${response.status}.`;
        const failure = classifyFailure(message, response.status, handle);
        if (attempt === 0 && failure.code === "RATE_LIMITED") {
          nextAllowedRequest = Date.now() + 2_300;
          continue;
        }
        throw failure;
      }
    } catch (error) {
      rejectRequest(error);
    }
  });

  return result;
}

async function loadSubmissionHistory(handle: string): Promise<SubmissionHistory> {
  const submissions: Submission[] = [];

  while (submissions.length < SUBMISSION_HISTORY_LIMIT) {
    const page = await requestCodeforces<Submission[]>(
      "user.status",
      {
        handle,
        from: String(submissions.length + 1),
        count: String(Math.min(SUBMISSION_PAGE_SIZE, SUBMISSION_HISTORY_LIMIT - submissions.length)),
      },
      handle,
    );
    submissions.push(...page);
    if (page.length < SUBMISSION_PAGE_SIZE) return { submissions, complete: true };
  }

  const oneMore = await requestCodeforces<Submission[]>(
    "user.status",
    { handle, from: String(SUBMISSION_HISTORY_LIMIT + 1), count: "1" },
    handle,
  );
  return { submissions, complete: oneMore.length === 0 };
}

async function loadSingleUser(handle: string) {
  const cacheKey = `user:${handle.toLowerCase()}`;
  const cached = readCache<UserStats>(cacheKey);
  if (cached) return cached;

  const users = await requestCodeforces<CodeforcesUser[]>("user.info", { handles: handle }, handle);
  const user = users[0];
  if (!user) {
    throw new CodeforcesApiError("USER_NOT_FOUND", `The Codeforces handle “${handle}” was not found.`, handle);
  }

  const ratings = await requestCodeforces<RatingChange[]>("user.rating", { handle: user.handle }, user.handle);
  const history = await loadSubmissionHistory(user.handle);
  const summary = deriveUserStats(
    user,
    ratings,
    history.submissions,
    history.complete,
    SUBMISSION_HISTORY_LIMIT,
  );
  writeCache(cacheKey, summary, USER_CACHE_MS);
  return summary;
}

function validateHandles(handles: string[]) {
  const normalized = handles.map((handle) => handle.trim()).filter(Boolean);
  if (!normalized.length || normalized.length > 2) {
    throw new CodeforcesApiError("INVALID_HANDLE", "Enter one or two Codeforces handles.");
  }
  const invalid = normalized.find((handle) => !/^[a-zA-Z0-9_.-]{1,24}$/.test(handle));
  if (invalid) {
    throw new CodeforcesApiError(
      "INVALID_HANDLE",
      `“${invalid}” is not a valid Codeforces handle.`,
      invalid,
    );
  }
  return normalized;
}

export async function fetchUpcomingContests() {
  const cached = readCache<Contest[]>("contests");
  if (cached) return cached;

  const allContests = await requestCodeforces<Contest[]>("contest.list", { gym: "false" });
  const currentTime = Math.floor(Date.now() / 1_000);
  const contests = allContests
    .filter(
      (contest) =>
        contest.phase === "CODING" ||
        (contest.phase === "BEFORE" && (contest.startTimeSeconds || 0) > currentTime),
    )
    .sort((left, right) => (left.startTimeSeconds || 0) - (right.startTimeSeconds || 0));
  writeCache("contests", contests, CONTEST_CACHE_MS);
  return contests;
}

export async function fetchUserStats(handles: string[]) {
  const normalizedHandles = validateHandles(handles);
  const settled = await Promise.allSettled(normalizedHandles.map(loadSingleUser));
  const failedIndex = settled.findIndex((result) => result.status === "rejected");

  if (failedIndex !== -1) {
    const failure = settled[failedIndex];
    const failedHandle = normalizedHandles[failedIndex];
    if (normalizedHandles.length === 2 && settled.some((result) => result.status === "fulfilled")) {
      const cause = failure.status === "rejected" ? failure.reason : undefined;
      const detail = cause instanceof CodeforcesApiError ? cause.message : "could not be loaded";
      throw new CodeforcesApiError(
        "PARTIAL_COMPARISON",
        `The other profile loaded, but ${detail.charAt(0).toLowerCase()}${detail.slice(1)}`,
        failedHandle,
      );
    }
    if (failure.status === "rejected") throw failure.reason;
  }

  return settled
    .filter((result): result is PromiseFulfilledResult<UserStats> => result.status === "fulfilled")
    .map((result) => result.value);
}
