import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Codeforces API service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("rejects invalid handles before making a network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { fetchUserStats } = await import("./codeforcesApi");

    await expect(fetchUserStats(["invalid handle!"])).rejects.toMatchObject({
      code: "INVALID_HANDLE",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a missing handle distinctly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ status: "FAILED", comment: "handles: User with handle missing not found" }),
    }));
    const { fetchUserStats } = await import("./codeforcesApi");

    await expect(fetchUserStats(["missing"])).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
      message: "The Codeforces handle “missing” was not found.",
    });
  });

  it("rejects malformed API responses with a useful error type", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    }));
    const { fetchUpcomingContests } = await import("./codeforcesApi");

    await expect(fetchUpcomingContests()).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });
});
