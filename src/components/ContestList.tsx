import type { Contest } from "../types/codeforces";
import { formatCountdown, formatDuration } from "../utils/formatters";

type ContestListProps = {
  contests: Contest[];
  state: "loading" | "success" | "error";
  error: string;
  now: number;
  onRetry: () => void;
};

export function ContestList({ contests, state, error, now, onRetry }: ContestListProps) {
  return (
    <section className="dashboard-card content-section" id="contests">
      <div className="card-heading section-heading-row">
        <div>
          <h2>Upcoming contests</h2>
          <p>Contest times are shown in your local timezone.</p>
        </div>
        <a href="https://codeforces.com/contests" target="_blank" rel="noreferrer">
          View all on Codeforces ↗
        </a>
      </div>
      <div className="contest-box">
        {state === "loading" && (
          <div className="contest-loading" aria-live="polite" aria-label="Loading contests">
            {[1, 2, 3].map((item) => <i key={item} />)}
          </div>
        )}
        {state === "error" && (
          <div className="retry-row">
            <span>{error || "Could not load contests."}</span>
            <button type="button" onClick={onRetry}>Try again</button>
          </div>
        )}
        {state === "success" && contests.length === 0 && (
          <p className="message">No upcoming contests have been announced.</p>
        )}
        {state === "success" && contests.length > 0 && (
          <ol className="contest-list">
            {contests.slice(0, 6).map((contest) => {
              const start = new Date(contest.startTimeSeconds * 1_000);
              return (
                <li key={contest.id}>
                  <time dateTime={start.toISOString()}>
                    <strong>{start.toLocaleDateString(undefined, { day: "2-digit" })}</strong>
                    <span>{start.toLocaleDateString(undefined, { month: "short" })}</span>
                  </time>
                  <div>
                    <a
                      className="contest-name"
                      href={`https://codeforces.com/contest/${contest.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {contest.name} <span aria-hidden="true">↗</span>
                    </a>
                    <p>
                      {start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{formatDuration(contest.durationSeconds)}
                    </p>
                    <span className={`status-badge ${contest.phase === "CODING" ? "live" : ""}`}>
                      {contest.phase === "CODING"
                        ? "Live now"
                        : `Starts in ${formatCountdown(contest.startTimeSeconds, now)}`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
