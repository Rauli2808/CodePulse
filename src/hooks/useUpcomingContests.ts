import { useCallback, useEffect, useState } from "react";

import { fetchUpcomingContests } from "../services/codeforcesApi";
import { getUserFacingError } from "../services/codeforcesErrors";
import type { Contest } from "../types/codeforces";
import type { AsyncState } from "../types/asyncState";

export function useUpcomingContests() {
  const [state, setState] = useState<AsyncState<Contest[]>>({ status: "loading" });
  const [now, setNow] = useState(0);

  const reload = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "success", data: await fetchUpcomingContests() });
    } catch (error) {
      setState({ status: "error", message: getUserFacingError(error) });
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      setNow(Date.now());
      void reload();
    }, 0);
    const clock = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(clock);
    };
  }, [reload]);

  return {
    contests: state.status === "success" ? state.data : [],
    status: state.status === "idle" ? "loading" : state.status,
    error: state.status === "error" ? state.message : "",
    now,
    reload,
  };
}
