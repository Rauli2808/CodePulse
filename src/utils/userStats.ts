import type {
  CodeforcesUser,
  RatingChange,
  Submission,
  UserStats,
} from "../types/codeforces";

function problemKey(submission: Submission) {
  const { problem } = submission;
  return `${problem.contestId ?? problem.problemsetName ?? "set"}-${problem.index}-${problem.name}`;
}

function uniqueSolvedSubmissions(submissions: Submission[]) {
  const solved = new Map<string, Submission>();
  submissions.forEach((submission) => {
    if (submission.verdict === "OK" && !solved.has(problemKey(submission))) {
      solved.set(problemKey(submission), submission);
    }
  });
  return [...solved.values()];
}

export function calculateSolvedProblems(submissions: Submission[]) {
  return uniqueSolvedSubmissions(submissions).length;
}

export function calculateAcceptanceRate(submissions: Submission[]) {
  if (!submissions.length) return 0;
  const accepted = submissions.filter((submission) => submission.verdict === "OK").length;
  return Math.round((accepted / submissions.length) * 100);
}

export function getTopTags(submissions: Submission[], limit = 7) {
  const counts = new Map<string, number>();
  uniqueSolvedSubmissions(submissions).forEach((submission) => {
    submission.problem.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function getHardestSolvedProblem(submissions: Submission[]) {
  const hardest = uniqueSolvedSubmissions(submissions)
    .filter((submission) => submission.problem.rating !== undefined)
    .sort((left, right) => (right.problem.rating || 0) - (left.problem.rating || 0))[0];

  if (!hardest) return undefined;
  return {
    name: hardest.problem.name,
    rating: hardest.problem.rating || 0,
    contestId: hardest.problem.contestId,
    index: hardest.problem.index,
  };
}

export function buildSubmissionActivity(submissions: Submission[], referenceDate = new Date()) {
  const months: Array<{ key: string; label: string; count: number }> = [];
  const currentMonth = new Date(referenceDate);
  currentMonth.setUTCDate(1);
  currentMonth.setUTCHours(0, 0, 0, 0);

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - offset, 1));
    months.push({
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      label: date.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
      count: 0,
    });
  }

  const monthMap = new Map(months.map((month) => [month.key, month]));
  submissions.forEach((submission) => {
    const date = new Date(submission.creationTimeSeconds * 1_000);
    const month = monthMap.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`);
    if (month) month.count += 1;
  });
  return months.map(({ label, count }) => ({ label, count }));
}

export function deriveUserStats(
  user: CodeforcesUser,
  ratings: RatingChange[],
  submissions: Submission[],
  submissionHistoryComplete: boolean,
  submissionHistoryLimit: number,
): UserStats {
  const solvedSubmissions = uniqueSolvedSubmissions(submissions);
  const attempted = new Set(submissions.map(problemKey)).size;
  const acceptedSubmissions = submissions.filter((submission) => submission.verdict === "OK").length;
  const ratedSolves = solvedSubmissions.filter((submission) => submission.problem.rating !== undefined);
  const languageCounts = new Map<string, number>();
  submissions.forEach((submission) => {
    if (submission.programmingLanguage) {
      languageCounts.set(
        submission.programmingLanguage,
        (languageCounts.get(submission.programmingLanguage) || 0) + 1,
      );
    }
  });
  const changes = ratings.map((item) => item.newRating - item.oldRating);

  return {
    ...user,
    contribution: user.contribution || 0,
    friendOfCount: user.friendOfCount || 0,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "unrated",
    maxRank: user.maxRank || "unrated",
    contests: ratings.length,
    solved: calculateSolvedProblems(submissions),
    attempted,
    submissions: submissions.length,
    acceptedSubmissions,
    accuracy: calculateAcceptanceRate(submissions),
    averageSolvedRating: ratedSolves.length
      ? Math.round(
          ratedSolves.reduce((sum, submission) => sum + (submission.problem.rating || 0), 0) /
            ratedSolves.length,
        )
      : 0,
    hardestSolved: getHardestSolvedProblem(submissions),
    topTags: getTopTags(submissions),
    topLanguages: [...languageCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 3)
      .map(([name, count]) => ({ name, count })),
    activity: buildSubmissionActivity(submissions),
    ratingHistory: ratings,
    recentChanges: ratings.slice(-8),
    bestChange: changes.length ? Math.max(...changes) : 0,
    worstChange: changes.length ? Math.min(...changes) : 0,
    submissionHistoryComplete,
    submissionHistoryLimit,
  };
}
