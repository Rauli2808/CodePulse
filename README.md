# CodePulse

CodePulse is a responsive frontend for exploring public Codeforces data. It
shows upcoming contests, summarizes a handle's contest and submission history,
and compares two users through a shareable URL.

## Features

- Upcoming and currently running Codeforces contests in the viewer's timezone
- User profile, rating history, solved problems, tags, languages, and activity
- Side-by-side comparison of two Codeforces handles
- Shareable comparisons using `?user1=tourist&user2=Benq#compare`
- Light and dark themes with responsive layouts
- Specific messages for invalid handles, missing users, network failures, rate
  limits, unavailable services, and malformed responses

## Tech stack

- React 19
- TypeScript
- Vite
- Codeforces REST API
- Vitest
- React Testing Library
- Plain CSS

## Technical decisions

### API pacing and caching

Codeforces allows one API call every two seconds. A small request queue spaces
calls by 2.1 seconds and retries one rate-limited request. Contest responses are
cached for two minutes and user summaries for fifteen minutes.

### Submission history

`user.status` is fetched in pages instead of treating one response as a user's
complete history. CodePulse reads up to 100,000 submissions. If a handle exceeds
that safety limit, every affected statistic is labelled as based on fetched
history rather than presented as a lifetime total.

### React state

Server-state orchestration is separated into three focused hooks:

- `useUpcomingContests`
- `useCodeforcesUser`
- `useUserComparison`

Presentational components receive data and callbacks without knowing how API
requests are scheduled. Comparison handles are synchronized with browser
history through URL query parameters; a routing library is unnecessary for the
single-page application.

### Derived statistics and tests

Solved-problem counts, acceptance rate, strongest tags, hardest solved problem,
and monthly activity are pure functions in `src/utils/userStats.ts`. The test
suite covers those calculations, validation and API error handling, loading and
failure states, comparison rendering, and URL restoration.

## Project structure

```text
src/
├── components/    Presentational React components
├── hooks/         User, contest, and comparison state
├── services/      Typed Codeforces API client and errors
├── test/          Shared test setup
├── types/         API and application types
├── utils/         Pure calculations, URLs, and formatters
├── App.tsx        Page composition
└── main.tsx       React entry point
```

## Setup

Node.js 20.19 or newer is required. The included `.nvmrc` selects a compatible
version when using nvm.

```bash
nvm use
npm install
npm run dev
```

Vite normally serves the app at `http://localhost:5173`.

## Validation

```bash
npm run lint
npm test
npm run build
```

Use `npm run test:watch` while developing.

## Known limitations

- CodePulse uses anonymous public API methods and is subject to Codeforces
  availability and request limits.
- Fetching a large submission history or comparing two highly active users can
  take several seconds because requests must be paced.
- Histories beyond 100,000 submissions are intentionally limited and clearly
  labelled in the interface.
- Statistics reflect public Codeforces submissions only.

CodePulse is not affiliated with Codeforces.
