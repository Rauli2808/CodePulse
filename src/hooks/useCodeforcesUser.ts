import { useCallback, useRef, useState } from "react";

import { fetchUserStats } from "../services/codeforcesApi";
import { getUserFacingError } from "../services/codeforcesErrors";
import type { AsyncState } from "../types/asyncState";
import type { UserStats } from "../types/codeforces";

export function useCodeforcesUser() {
  const [state, setState] = useState<AsyncState<UserStats>>({ status: "idle" });
  const requestId = useRef(0);

  const load = useCallback(async (handle: string) => {
    const currentRequest = ++requestId.current;
    setState({ status: "loading" });
    try {
      const [user] = await fetchUserStats([handle]);
      if (currentRequest === requestId.current) setState({ status: "success", data: user });
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState({ status: "error", message: getUserFacingError(error) });
      }
    }
  }, []);

  return {
    user: state.status === "success" ? state.data : null,
    status: state.status,
    error: state.status === "error" ? state.message : "",
    load,
  };
}
