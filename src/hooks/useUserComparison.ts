import { useCallback, useEffect, useRef, useState } from "react";

import { fetchUserStats } from "../services/codeforcesApi";
import { CodeforcesApiError, getUserFacingError } from "../services/codeforcesErrors";
import type { AsyncState } from "../types/asyncState";
import type { UserStats } from "../types/codeforces";
import { buildComparisonUrl, readComparisonHandles } from "../utils/comparisonUrl";

type Comparison = [UserStats, UserStats];

function initialHandles() {
  const fromUrl = readComparisonHandles(window.location.search);
  return fromUrl || { user1: "tourist", user2: "Petr" };
}

export function useUserComparison() {
  const [initial] = useState(initialHandles);
  const [leftHandle, setLeftHandle] = useState(initial.user1);
  const [rightHandle, setRightHandle] = useState(initial.user2);
  const [state, setState] = useState<AsyncState<Comparison>>({ status: "idle" });
  const [copyMessage, setCopyMessage] = useState("");
  const requestId = useRef(0);

  const runComparison = useCallback(async (left: string, right: string, updateHistory: boolean) => {
    const normalizedLeft = left.trim();
    const normalizedRight = right.trim();
    const currentRequest = ++requestId.current;
    setCopyMessage("");

    if (!normalizedLeft || !normalizedRight) {
      setState({ status: "error", message: "Enter both Codeforces handles." });
      return;
    }
    if (normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()) {
      setState({ status: "error", message: "Please enter two different handles." });
      return;
    }

    setState({ status: "loading" });
    try {
      const users = await fetchUserStats([normalizedLeft, normalizedRight]);
      if (users.length !== 2) {
        throw new CodeforcesApiError(
          "MALFORMED_RESPONSE",
          "Codeforces did not return both requested profiles.",
        );
      }
      if (currentRequest !== requestId.current) return;
      const comparison: Comparison = [users[0], users[1]];
      setLeftHandle(users[0].handle);
      setRightHandle(users[1].handle);
      setState({ status: "success", data: comparison });
      if (updateHistory) {
        const url = buildComparisonUrl(window.location.href, users[0].handle, users[1].handle);
        window.history.pushState({}, "", url);
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState({ status: "error", message: getUserFacingError(error) });
      }
    }
  }, []);

  useEffect(() => {
    const loadFromLocation = () => {
      const handles = readComparisonHandles(window.location.search);
      if (!handles) {
        requestId.current += 1;
        setState({ status: "idle" });
        return;
      }
      setLeftHandle(handles.user1);
      setRightHandle(handles.user2);
      void runComparison(handles.user1, handles.user2, false);
    };

    const initialLoad = window.setTimeout(() => {
      if (readComparisonHandles(window.location.search)) loadFromLocation();
    }, 0);
    window.addEventListener("popstate", loadFromLocation);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("popstate", loadFromLocation);
    };
  }, [runComparison]);

  const copyShareLink = useCallback(async () => {
    const url = buildComparisonUrl(window.location.href, leftHandle, rightHandle).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("Comparison link copied.");
    } catch {
      setCopyMessage("Copy the comparison URL from your address bar.");
    }
  }, [leftHandle, rightHandle]);

  return {
    leftHandle,
    rightHandle,
    setLeftHandle,
    setRightHandle,
    comparison: state.status === "success" ? state.data : null,
    status: state.status,
    error: state.status === "error" ? state.message : "",
    compare: () => runComparison(leftHandle, rightHandle, true),
    copyShareLink,
    copyMessage,
  };
}
