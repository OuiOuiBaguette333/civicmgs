import { melbourneDay } from "@data/elections";
import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 60_000;

/**
 * The current instant, replaced only when the calendar day in Melbourne turns
 * over. A countdown measured in whole days has nothing new to say until then,
 * so polling every minute and keeping the old Date otherwise leaves a tab open
 * overnight correct without re-rendering it 1,440 times a day.
 */
export function useToday() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(current =>
        melbourneDay(new Date()) === melbourneDay(current) ? current : new Date(),
      );
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return now;
}
