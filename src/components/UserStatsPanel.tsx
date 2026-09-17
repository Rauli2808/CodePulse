import { useState } from "react";

import type { UserStats } from "../types/codeforces";
import { formatImageUrl, formatNumber, rankColor } from "../utils/formatters";
import { RatingHistoryChart } from "./RatingHistoryChart";

function Avatar({ user }: { user: UserStats }) {
  const [failed, setFailed] = useState(false);
  const image = formatImageUrl(user.titlePhoto || user.avatar);

  if (!image || failed) {
    return <div className="avatar-placeholder">{user.handle.slice(0, 2).toUpperCase()}</div>;
  }

  return (
    <img
      className="avatar"
      src={image}
      alt={`${user.handle} avatar`}
      onError={() => setFailed(true)}
    />
  );
}

export function UserStatsPanel({ user }: { user: UserStats }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const recent = [...user.recentChanges].reverse().slice(0, 6);
  const activityMax = Math.max(...user.activity.map((month) => month.count), 1);
  const topTags = user.topTags.slice(0, 5);
  const topTagCount = Math.max(...topTags.map((tag) => tag.count), 1);

  return (
    <div className="user-result" aria-live="polite">
      <div className="profile-row">
        <Avatar user={user} />
        <div className="profile-info">
          <h2 style={{ color: rankColor(user.rating) }}>{user.handle}</h2>
          <p>
            {fullName || "Codeforces user"}
            {user.country ? ` · ${user.country}` : ""}
          </p>
          <span>
            {user.rank}
            {user.organization ? ` · ${user.organization}` : ""}
          </span>
        </div>
        <a
          className="secondary-button"
          href={`https://codeforces.com/profile/${encodeURIComponent(user.handle)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open profile ↗
        </a>
      </div>

      <div className="stats-grid">
        <div className="rating-stat">
          <span>Current rating</span>
          <strong>{formatNumber(user.rating)} <em>· {user.rank}</em></strong>
        </div>
        <div className="rating-stat">
          <span>Maximum rating</span>
          <strong>{formatNumber(user.maxRating)} <em>· {user.maxRank}</em></strong>
        </div>
        <div>
          <span>{user.submissionHistoryComplete ? "Problems solved" : "Problems solved (fetched)"}</span>
          <strong>{formatNumber(user.solved)}</strong>
        </div>
        <div><span>Rated contests</span><strong>{formatNumber(user.contests)}</strong></div>
        <div>
          <span>{user.submissionHistoryComplete ? "Acceptance rate" : "Acceptance rate (fetched)"}</span>
          <strong>{user.accuracy}%</strong>
        </div>
        <div>
          <span>{user.submissionHistoryComplete ? "Average solved rating" : "Average rating (fetched)"}</span>
          <strong>{user.averageSolvedRating ? formatNumber(user.averageSolvedRating) : "—"}</strong>
        </div>
      </div>
      <p className="history-note">
        {user.submissionHistoryComplete
          ? `Problem statistics use all ${formatNumber(user.submissions)} public submissions returned by Codeforces.`
          : `Problem statistics use the latest ${formatNumber(user.submissions)} submissions and may not represent lifetime totals.`}
      </p>

      <RatingHistoryChart key={user.handle} handle={user.handle} history={user.ratingHistory} />

      <div className="details-grid">
        <div className="detail-box">
          <h4>Recent rated contests</h4>
          {recent.length ? (
            <div className="table-wrap">
              <table>
                <caption className="sr-only">Recent rated contests for {user.handle}</caption>
                <thead>
                  <tr><th>Contest</th><th>Rank</th><th>Change</th><th>Rating</th></tr>
                </thead>
                <tbody>
                  {recent.map((item) => {
                    const change = item.newRating - item.oldRating;
                    return (
                      <tr key={`${item.contestId}-${item.ratingUpdateTimeSeconds}`}>
                        <td>
                          <a
                            href={`https://codeforces.com/contest/${item.contestId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.contestName}
                          </a>
                        </td>
                        <td>{formatNumber(item.rank)}</td>
                        <td className={change >= 0 ? "positive" : "negative"}>
                          {change >= 0 ? "+" : ""}{change}
                        </td>
                        <td>{item.newRating}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-text">No rated contest history found.</p>
          )}
        </div>

        <div className="detail-box">
          <h4>Problem-solving summary</h4>
          <dl className="summary-list">
            <div><dt>Attempted problems</dt><dd>{formatNumber(user.attempted)}</dd></div>
            <div><dt>Accepted submissions</dt><dd>{formatNumber(user.acceptedSubmissions)}</dd></div>
            <div>
              <dt>Last online</dt>
              <dd>
                {user.lastOnlineTimeSeconds
                  ? new Date(user.lastOnlineTimeSeconds * 1_000).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
          </dl>

          {user.hardestSolved && (
            <div className="hardest-problem">
              <span>Hardest solved problem</span>
              <strong>{user.hardestSolved.name} ({user.hardestSolved.rating})</strong>
              {user.hardestSolved.contestId && (
                <a
                  href={`https://codeforces.com/problemset/problem/${user.hardestSolved.contestId}/${user.hardestSolved.index}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View problem ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="detail-box">
          <h4>Top problem tags</h4>
          <div className="tag-rank-list" role="list" aria-label={`Top problem tags for ${user.handle}`}>
            {topTags.length ? (
              topTags.map((tag) => (
                <div key={tag.name} role="listitem">
                  <div>
                    <span>{tag.name}</span>
                    <strong>{tag.count}</strong>
                  </div>
                  <span className="tag-rank-track" aria-hidden="true">
                    <i style={{ width: `${(tag.count / topTagCount) * 100}%` }} />
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">No tags found.</p>
            )}
          </div>
          {!!user.topLanguages.length && (
            <>
              <h4 className="subheading">Most-used languages</h4>
              <div className="tag-list muted-tags">
                {user.topLanguages.slice(0, 3).map((language) => (
                  <span key={language.name}>{language.name} <small>{language.count}</small></span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="detail-box">
          <h4>Submissions in the last six months</h4>
          <div className="activity-list">
            {user.activity.map((month) => (
              <div key={month.label}>
                <span>{month.label}</span>
                <div><i style={{ width: `${(month.count / activityMax) * 100}%` }} /></div>
                <strong>{month.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
