import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CodeforcesApiError } from "./services/codeforcesErrors";
import type { UserStats } from "./types/codeforces";

const apiMocks = vi.hoisted(() => ({
  fetchUpcomingContests: vi.fn(),
  fetchUserStats: vi.fn(),
}));

vi.mock("./services/codeforcesApi", () => apiMocks);

import App from "./App";

function userStats(handle: string, rating: number): UserStats {
  const ratingHistory = [
    {
      contestId: 100,
      contestName: "Codeforces Round 100",
      rank: 200,
      ratingUpdateTimeSeconds: 1_700_000_000,
      oldRating: rating - 150,
      newRating: rating - 80,
    },
    {
      contestId: 101,
      contestName: "Codeforces Round 101",
      rank: 120,
      ratingUpdateTimeSeconds: 1_710_000_000,
      oldRating: rating - 80,
      newRating: rating,
    },
  ];
  return {
    handle,
    rating,
    maxRating: rating + 100,
    rank: "expert",
    maxRank: "candidate master",
    contribution: 0,
    friendOfCount: 0,
    contests: 12,
    solved: 150,
    attempted: 180,
    submissions: 300,
    acceptedSubmissions: 160,
    accuracy: 53,
    averageSolvedRating: 1500,
    topTags: [{ name: "math", count: 20 }],
    topLanguages: [{ name: "GNU C++20", count: 250 }],
    activity: [
      { label: "Apr", count: 1 },
      { label: "May", count: 2 },
      { label: "Jun", count: 3 },
      { label: "Jul", count: 4 },
      { label: "Aug", count: 5 },
      { label: "Sep", count: 6 },
    ],
    ratingHistory,
    recentChanges: ratingHistory,
    bestChange: 50,
    worstChange: -20,
    submissionHistoryComplete: true,
    submissionHistoryLimit: 100_000,
  };
}

describe("CodePulse", () => {
  beforeEach(() => {
    apiMocks.fetchUpcomingContests.mockReset().mockResolvedValue([]);
    apiMocks.fetchUserStats.mockReset();
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
  });

  it("shows an independent loading state while a profile is fetched", async () => {
    apiMocks.fetchUserStats.mockReturnValue(new Promise(() => undefined));
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "View profile" }));

    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Loading analytics for rahulsingh28082000");
  });

  it("renders loaded analytics outside the compact lookup card", async () => {
    apiMocks.fetchUserStats.mockResolvedValue([userStats("demo", 1511)]);
    render(<App />);

    await userEvent.clear(screen.getByLabelText("Codeforces handle"));
    await userEvent.type(screen.getByLabelText("Codeforces handle"), "demo");
    await userEvent.click(screen.getByRole("button", { name: "View profile" }));

    const analytics = await screen.findByRole("region", { name: "User analytics" });
    const lookup = screen.getByRole("heading", { name: "Analyze a Codeforces handle" }).closest("section");
    expect(within(analytics).getByRole("heading", { name: "demo" })).toBeInTheDocument();
    expect(within(analytics).getByRole("button", { name: /Rating history for demo/ })).toBeInTheDocument();
    expect(within(lookup as HTMLElement).queryByText("Current rating")).not.toBeInTheDocument();
    expect(screen.queryByText("Submissions fetched")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "User stats" })).toHaveAttribute("href", "#user-analytics");
  });

  it("shows a useful user-not-found failure", async () => {
    apiMocks.fetchUserStats.mockRejectedValue(
      new CodeforcesApiError("USER_NOT_FOUND", "The Codeforces handle “missing” was not found.", "missing"),
    );
    render(<App />);

    await userEvent.clear(screen.getByLabelText("Codeforces handle"));
    await userEvent.type(screen.getByLabelText("Codeforces handle"), "missing");
    await userEvent.click(screen.getByRole("button", { name: "View profile" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The Codeforces handle “missing” was not found.",
    );
  });

  it("renders a comparison and stores it in the URL", async () => {
    apiMocks.fetchUserStats.mockResolvedValue([userStats("tourist", 3800), userStats("Benq", 3100)]);
    render(<App />);

    const first = screen.getByLabelText("First handle");
    const second = screen.getByLabelText("Second handle");
    await userEvent.clear(first);
    await userEvent.type(first, "tourist");
    await userEvent.clear(second);
    await userEvent.type(second, "Benq");
    await userEvent.click(screen.getByRole("button", { name: "Compare" }));

    expect(await screen.findByRole("button", { name: "Copy comparison link" })).toBeInTheDocument();
    expect(screen.getAllByText("3,800")).toHaveLength(2);
    expect(new URLSearchParams(window.location.search).get("user2")).toBe("Benq");
  });

  it("restores and loads a comparison from a shared URL", async () => {
    window.history.replaceState({}, "", "/?user1=tourist&user2=Benq#compare");
    apiMocks.fetchUserStats.mockResolvedValue([userStats("tourist", 3800), userStats("Benq", 3100)]);
    render(<App />);

    expect(await screen.findByRole("button", { name: "Copy comparison link" })).toBeInTheDocument();
    expect(screen.getByLabelText("First handle")).toHaveValue("tourist");
    expect(screen.getByLabelText("Second handle")).toHaveValue("Benq");
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("aria-current", "location");
  });

  it("responds to browser history navigation", async () => {
    window.history.replaceState({}, "", "/?user1=tourist&user2=Benq#compare");
    apiMocks.fetchUserStats.mockImplementation(async ([left, right]: string[]) => [
      userStats(left, 3000),
      userStats(right, 2800),
    ]);
    render(<App />);
    await screen.findByRole("button", { name: "Copy comparison link" });

    window.history.pushState({}, "", "/?user1=Petr&user2=Um_nik#compare");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => expect(screen.getByLabelText("First handle")).toHaveValue("Petr"));
    expect(screen.getByLabelText("Second handle")).toHaveValue("Um_nik");
    expect(apiMocks.fetchUserStats).toHaveBeenLastCalledWith(["Petr", "Um_nik"]);
  });
});
