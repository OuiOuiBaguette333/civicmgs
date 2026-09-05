import { useCallback, useEffect, useState } from "react";

export type LazyState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "failed" };

/**
 * A chunk fetched on demand, with the failure made visible.
 *
 * Vite names chunks by content, so a deploy in the middle of someone's visit
 * turns every chunk they have not loaded yet into a 404. Left unhandled that
 * is a "Loading…" that never ends and nothing to click. The loader must be a
 * stable function — module-level, not an inline arrow — or the effect re-runs
 * on every render.
 */
export function useLazyData<T>(load: () => Promise<T>, enabled = true) {
  const [state, setState] = useState<LazyState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    setState(current => (current.status === "failed" ? { status: "loading" } : current));

    load().then(
      data => {
        if (!cancelled) setState({ status: "ready", data });
      },
      () => {
        if (!cancelled) setState({ status: "failed" });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [load, enabled, attempt]);

  const retry = useCallback(() => setAttempt(count => count + 1), []);

  return { state, retry };
}
