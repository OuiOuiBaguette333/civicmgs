import { useEffect, useState } from "react";

const DURATION_MS = 900;

/**
 * A number that counts up to its target when it first appears, then follows
 * it exactly. For a hero figure the count is the one moment of theatre on the
 * page; it is skipped entirely for a reader who has asked for less motion,
 * and after the first arrival the value simply tracks.
 */
export function useCountUp(target: number) {
  const [shown, setShown] = useState(() =>
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? target : 0,
  );

  useEffect(() => {
    if (shown === target) return;

    const from = shown;
    const start = performance.now();
    let frame = 0;

    const step = (time: number) => {
      const progress = Math.min((time - start) / DURATION_MS, 1);
      // Ease out: fast at first, settling as it lands.
      const eased = 1 - (1 - progress) ** 3;

      setShown(Math.round(from + (target - from) * eased));

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
    // Re-run only when the target moves; `shown` changing is the animation itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return shown;
}
