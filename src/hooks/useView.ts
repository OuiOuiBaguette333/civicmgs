import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export type View = "home" | "dashboard";

const TITLES: Record<View, string> = {
  home: "CivicLens",
  dashboard: "Suburb snapshot — CivicLens",
};

/**
 * Which page is showing, with the two things a real navigation would have done
 * for free: the tab title changes, and focus moves to the new page's heading
 * so a keyboard or screen-reader user is not left at the top of a document
 * that silently swapped underneath them.
 *
 * Where the browser offers a view transition the swap crossfades; elsewhere it
 * is instant. Either way the state change is the same.
 */
export function useView(initial: View) {
  const [view, setViewState] = useState(initial);
  const first = useRef(true);

  useEffect(() => {
    document.title = TITLES[view];

    // The heading is only focused on a change of page, never on first paint,
    // which would pull focus away from wherever the reader started.
    if (first.current) {
      first.current = false;
      return;
    }

    const heading = document.querySelector<HTMLElement>("main h1");

    heading?.focus({ preventScroll: true });
    globalThis.scrollTo({ top: 0 });
  }, [view]);

  const setView = (next: View) => {
    if (next === view) return;

    const transition = document.startViewTransition?.bind(document);

    if (transition && !globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // The browser snapshots the old page, runs this, then snapshots the new
      // one — so the state change has to reach the DOM inside the callback,
      // not on React's next batch.
      transition(() => flushSync(() => setViewState(next)));
    } else {
      setViewState(next);
    }
  };

  return [view, setView] as const;
}
