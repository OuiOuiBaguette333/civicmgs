import { clampViewport, type Viewport } from "@utils/viewport";
import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

const GLIDE_MS = 260;

const reducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Moves the viewport to a target over a few frames instead of jumping there.
 *
 * The centre travels in a straight line while the width changes by a constant
 * ratio each step — zoom is multiplicative, so a linear width would rush the
 * start and crawl the end. Used for the discrete moves (buttons, keys, reset);
 * the wheel and a drag already give continuous feedback and stay immediate.
 */
export function useGlide(base: Viewport, setView: Dispatch<SetStateAction<Viewport>>) {
  const frame = useRef(0);

  const cancel = useCallback(() => cancelAnimationFrame(frame.current), []);

  useEffect(() => cancel, [cancel]);

  const glide = useCallback(
    (from: Viewport, to: Viewport) => {
      cancel();

      if (reducedMotion()) {
        setView(to);
        return;
      }

      const start = performance.now();
      const centre = {
        x0: from.x + from.width / 2,
        y0: from.y + from.height / 2,
        x1: to.x + to.width / 2,
        y1: to.y + to.height / 2,
      };
      const ratio = to.width / from.width;

      const step = (time: number) => {
        const progress = Math.min((time - start) / GLIDE_MS, 1);
        const eased = 1 - (1 - progress) ** 3;
        const width = from.width * ratio ** eased;
        const height = from.height * ratio ** eased;
        const cx = centre.x0 + (centre.x1 - centre.x0) * eased;
        const cy = centre.y0 + (centre.y1 - centre.y0) * eased;

        // Both ends are legal viewports; the path between them can still brush
        // an edge when the target sits against one, so each frame is clamped.
        setView(clampViewport({ x: cx - width / 2, y: cy - height / 2, width, height }, base));

        if (progress < 1) frame.current = requestAnimationFrame(step);
      };

      frame.current = requestAnimationFrame(step);
    },
    [base, cancel, setView],
  );

  return { glide, cancel };
}
