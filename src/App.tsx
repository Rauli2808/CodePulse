import { type FormEvent, useEffect, useState } from "react";

import { ComparisonTable } from "./components/ComparisonTable";
import { ContestList } from "./components/ContestList";
import { Header } from "./components/Header";
import { UserStatsPanel } from "./components/UserStatsPanel";
import { useCodeforcesUser } from "./hooks/useCodeforcesUser";
import { useActiveSection } from "./hooks/useActiveSection";
import { useUpcomingContests } from "./hooks/useUpcomingContests";
import { useUserComparison } from "./hooks/useUserComparison";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  const savedTheme = window.localStorage.getItem("codepulse-theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [handle, setHandle] = useState("rahulsingh28082000");
  const userQuery = useCodeforcesUser();
  const contestQuery = useUpcomingContests();
  const comparisonQuery = useUserComparison();
  const hasAnalytics = userQuery.status !== "idle";
  const navigation = useActiveSection(hasAnalytics);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("codepulse-theme", theme);
  }, [theme]);

  async function analyzeUser(event?: FormEvent, selectedHandle?: string) {
    event?.preventDefault();
    const requestedHandle = (selectedHandle || handle).trim();
    if (!requestedHandle) return;

    setHandle(requestedHandle);
    await userQuery.load(requestedHandle);
  }

  return (
    <>
      <Header
        theme={theme}
        activeSection={navigation.activeSection}
        userStatsHref={hasAnalytics ? "#user-analytics" : "#user-stats"}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onNavigate={navigation.setActiveSection}
      />

      <main className="page-container">
        <section className="intro-section" id="overview">
          <p className="intro-kicker">Codeforces companion</p>
          <h1>Codeforces analytics, without the clutter.</h1>
          <p>Track upcoming contests, analyze handles, and compare competitors.</p>
        </section>

        <div className="dashboard-card">
          <section className="dashboard-card primary-section" id="user-stats">
            <div className="card-heading">
              <div>
                <h2>Analyze a Codeforces handle</h2>
                <p>View rating, contest history, solved problems, and activity.</p>
              </div>
            </div>
            <form
              className="search-form"
              aria-busy={userQuery.status === "loading"}
              onSubmit={(event) => void analyzeUser(event)}
            >
              <label htmlFor="handle">Codeforces handle</label>
              <div>
                <input
                  id="handle"
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                  placeholder="e.g. tourist"
                  autoComplete="off"
                />
                <button type="submit" disabled={userQuery.status === "loading"}>
                  {userQuery.status === "loading" ? "Loading…" : "View profile"}
                </button>
              </div>
            </form>
            <div className="example-handles">
              <span>Try:</span>
              {["tourist", "Petr", "Um_nik"].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => void analyzeUser(undefined, example)}
                  disabled={userQuery.status === "loading"}
                >
                  {example}
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-card">
            <ContestList
              contests={contestQuery.contests}
              state={contestQuery.status}
              error={contestQuery.error}
              now={contestQuery.now}
              onRetry={() => void contestQuery.reload()}
            />
          </section>
        </div>

        {hasAnalytics && (
          <section
            className="dashboard-card analytics-section"
            id="user-analytics"
            aria-label="User analytics"
          >
            {userQuery.status === "loading" && (
              <div className="analytics-loading" role="status" aria-live="polite">
                <div className="analytics-loading-heading">
                  <div>
                    <h2>Loading analytics for {handle}…</h2>
                    <p>Fetching the public profile, rating history, and submission data.</p>
                  </div>
                  <span className="loading-spinner" aria-hidden="true" />
                </div>
                <div className="analytics-skeleton" aria-hidden="true">
                  <i className="skeleton-profile" />
                  <div className="skeleton-stats">
                    {[1, 2, 3, 4, 5, 6].map((item) => <i key={item} />)}
                  </div>
                  <i className="skeleton-chart" />
                </div>
              </div>
            )}
            {userQuery.status === "error" && (
              <div className="analytics-error" role="alert" aria-live="assertive">
                <p>Profile lookup</p>
                <h2>We couldn&apos;t load that handle</h2>
                <span>{userQuery.error}</span>
              </div>
            )}
            {userQuery.status === "success" && userQuery.user && <UserStatsPanel user={userQuery.user} />}
          </section>
        )}

        <section className="dashboard-card compare-section" id="compare">
          <div className="card-heading compare-heading">
            <div>
              <h2>Compare Codeforces users</h2>
              <p>Compare rating, contest history, solved problems, and strengths side-by-side.</p>
            </div>
          </div>
          <form
            className="compare-form-simple"
            onSubmit={(event) => {
              event.preventDefault();
              void comparisonQuery.compare();
            }}
          >
            <div>
              <label htmlFor="left-handle">First handle</label>
              <input
                id="left-handle"
                value={comparisonQuery.leftHandle}
                onChange={(event) => comparisonQuery.setLeftHandle(event.target.value)}
                autoComplete="off"
              />
            </div>
            <span className="versus-badge" aria-hidden="true">VS</span>
            <div>
              <label htmlFor="right-handle">Second handle</label>
              <input
                id="right-handle"
                value={comparisonQuery.rightHandle}
                onChange={(event) => comparisonQuery.setRightHandle(event.target.value)}
                autoComplete="off"
              />
            </div>
            <button type="submit" disabled={comparisonQuery.status === "loading"}>
              {comparisonQuery.status === "loading" ? "Comparing…" : "Compare"}
            </button>
          </form>
          {comparisonQuery.error && (
            <p className="message error-message" role="alert">{comparisonQuery.error}</p>
          )}
          {comparisonQuery.status === "loading" && (
            <p className="message">Loading both users. The Codeforces API may take a few seconds.</p>
          )}
          {comparisonQuery.status === "success" && comparisonQuery.comparison && (
            <>
              <div className="comparison-actions">
                <button type="button" onClick={() => void comparisonQuery.copyShareLink()}>
                  Copy comparison link
                </button>
                {comparisonQuery.copyMessage && <span role="status">{comparisonQuery.copyMessage}</span>}
              </div>
              <ComparisonTable users={comparisonQuery.comparison} />
            </>
          )}
        </section>
      </main>

      <footer>
        <div>
          <strong>CodePulse</strong>
          <span>Uses the public Codeforces API. This project is not affiliated with Codeforces.</span>
        </div>
      </footer>
    </>
  );
}
