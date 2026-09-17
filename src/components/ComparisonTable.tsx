import type { UserStats } from "../types/codeforces";
import { formatNumber, rankColor } from "../utils/formatters";

export function ComparisonTable({ users }: { users: [UserStats, UserStats] }) {
  const [left, right] = users;
  const completeHistory = left.submissionHistoryComplete && right.submissionHistoryComplete;
  const ratingDifference = Math.abs(left.rating - right.rating);
  const leader = left.rating === right.rating ? null : left.rating > right.rating ? left : right;
  const metrics = [
    { label: "Current rating", left: left.rating, right: right.rating, suffix: "" },
    { label: "Maximum rating", left: left.maxRating, right: right.maxRating, suffix: "" },
    {
      label: completeHistory ? "Problems solved" : "Problems solved (fetched)",
      left: left.solved,
      right: right.solved,
      suffix: "",
    },
    { label: "Rated contests", left: left.contests, right: right.contests, suffix: "" },
    {
      label: completeHistory ? "Acceptance rate" : "Acceptance rate (fetched)",
      left: left.accuracy,
      right: right.accuracy,
      suffix: "%",
    },
    {
      label: "Average solved rating",
      left: left.averageSolvedRating,
      right: right.averageSolvedRating,
      suffix: "",
    },
  ];

  return (
    <div className="comparison-table-wrap" aria-live="polite">
      <div className="competitor-pair">
        <article className="competitor-card">
          <span>{left.rank}</span>
          <h3 style={{ color: rankColor(left.rating) }}>{left.handle}</h3>
          <strong>{formatNumber(left.rating)}</strong>
          <small>current rating</small>
        </article>
        <div className="comparison-lead">
          <span>VS</span>
          <p>{leader ? `${leader.handle} leads by ${formatNumber(ratingDifference)}` : "Ratings are tied"}</p>
        </div>
        <article className="competitor-card competitor-card-right">
          <span>{right.rank}</span>
          <h3 style={{ color: rankColor(right.rating) }}>{right.handle}</h3>
          <strong>{formatNumber(right.rating)}</strong>
          <small>current rating</small>
        </article>
      </div>
      <table className="comparison-table">
        <caption>Detailed comparison for {left.handle} and {right.handle}</caption>
        <thead>
          <tr>
            <th>
              <span style={{ color: rankColor(left.rating) }}>{left.handle}</span>
              <small>{left.rank}</small>
            </th>
            <th>Metric</th>
            <th>
              <span style={{ color: rankColor(right.rating) }}>{right.handle}</span>
              <small>{right.rank}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.label}>
              <td className={metric.left > metric.right ? "better" : ""}>
                {formatNumber(metric.left)}{metric.suffix}
              </td>
              <td>{metric.label}</td>
              <td className={metric.right > metric.left ? "better" : ""}>
                {formatNumber(metric.right)}{metric.suffix}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!completeHistory && (
        <p className="history-note comparison-history-note">
          At least one handle has more than {formatNumber(left.submissionHistoryLimit)} submissions, so submission-derived values are limited.
        </p>
      )}
      <div className="comparison-tags">
        <div>
          <strong>{left.handle}&apos;s top tags</strong>
          <p>{left.topTags.slice(0, 5).map((tag) => tag.name).join(", ") || "No data"}</p>
        </div>
        <div>
          <strong>{right.handle}&apos;s top tags</strong>
          <p>{right.topTags.slice(0, 5).map((tag) => tag.name).join(", ") || "No data"}</p>
        </div>
      </div>
    </div>
  );
}
