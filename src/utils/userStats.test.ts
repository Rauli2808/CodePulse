import { describe, expect, it } from "vitest";

import type { CodeforcesUser, Submission } from "../types/codeforces";
import {
  buildSubmissionActivity,
  calculateAcceptanceRate,
  calculateSolvedProblems,
  deriveUserStats,
  getHardestSolvedProblem,
  getTopTags,
} from "./userStats";

function submission(
  id: number,
  verdict: string,
  name: string,
  rating: number,
  tags: string[],
  creationTimeSeconds = 1_780_000_000,
): Submission {
  return {
    id,
    verdict,
    creationTimeSeconds,
    programmingLanguage: "GNU C++20",
    problem: { contestId: 100, index: String(id), name, rating, tags },
  };
}

describe("submission statistics", () => {
  const submissions = [
    submission(1, "OK", "Alpha", 1200, ["math", "greedy"]),
    submission(1, "OK", "Alpha", 1200, ["math", "greedy"]),
    submission(2, "WRONG_ANSWER", "Beta", 1800, ["graphs"]),
    submission(3, "OK", "Gamma", 2100, ["graphs", "dfs and similar"]),
  ];

  it("counts unique solved problems and submission acceptance correctly", () => {
    expect(calculateSolvedProblems(submissions)).toBe(2);
    expect(calculateAcceptanceRate(submissions)).toBe(75);
  });

  it("derives tags only from unique solved problems", () => {
    expect(getTopTags(submissions)).toEqual([
      { name: "graphs", count: 1 },
      { name: "greedy", count: 1 },
      { name: "math", count: 1 },
      { name: "dfs and similar", count: 1 },
    ].sort((left, right) => left.name.localeCompare(right.name)));
  });

  it("finds the highest-rated solved problem", () => {
    expect(getHardestSolvedProblem(submissions)).toMatchObject({ name: "Gamma", rating: 2100 });
  });

  it("builds stable monthly activity", () => {
    const may = Date.UTC(2026, 4, 15) / 1_000;
    const august = Date.UTC(2026, 7, 15) / 1_000;
    const activity = buildSubmissionActivity(
      [submission(4, "OK", "May", 900, [], may), submission(5, "OK", "August", 1000, [], august)],
      new Date(Date.UTC(2026, 8, 4)),
    );
    expect(activity.map((month) => month.label)).toEqual(["Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
    expect(activity.map((month) => month.count)).toEqual([0, 1, 0, 0, 1, 0]);

  });

  it("keeps the submission-history completeness flag in the derived result", () => {
    const user: CodeforcesUser = { handle: "demo", rating: 1500, maxRating: 1600 };
    const result = deriveUserStats(user, [], submissions, false, 100_000);
    expect(result.submissionHistoryComplete).toBe(false);
    expect(result.submissionHistoryLimit).toBe(100_000);
    expect(result.submissions).toBe(4);
    expect(result.ratingHistory).toEqual([]);
  });
});
