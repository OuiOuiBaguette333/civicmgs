import { useEffect, useState } from "react";

const TICK_MS = 60_000;

/**
 * The current instant, refreshed once a minute.
 *
 * The countdown counts calendar days, but the milestones around it are exact
 * instants — enrolment closes at 8 pm, not at midnight — so a clock that only
 * moved at midnight would keep saying "closes today" for hours after it had.
 * A re-render a minute of a small tree costs nothing worth saving.
 */
export function useToday() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);

    return () => clearInterval(timer);
  }, []);

  return now;
}
