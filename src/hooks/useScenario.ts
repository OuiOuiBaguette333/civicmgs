import { DEFAULT_COMMITMENT_YEARS } from "@model/cost";
import { NO_LEVER_CHANGES } from "@model/levers";
import { DEFAULT_HORIZON } from "@model/project";
import type { Location } from "@types";
import findLocationByCode from "@utils/findLocation";
import { decodeScenario, encodeScenario } from "@utils/scenario";
import { useEffect, useMemo, useState } from "react";

/**
 * Holds everything a shared link carries, and keeps the address bar in step
 * with it so any scenario on screen can be sent to someone else.
 */
export function useScenario() {
  const initial = useMemo(() => decodeScenario(globalThis.location?.search ?? ""), []);

  const [location, setLocation] = useState<Location | undefined>();
  const [levers, setLevers] = useState(initial.levers);
  const [horizonYears, setHorizonYears] = useState(initial.horizonYears);
  const [commitmentYears, setCommitmentYears] = useState(initial.commitmentYears);

  // The link carries only a code; the name always comes from our own data.
  useEffect(() => {
    if (!initial.sa2) return;

    let cancelled = false;

    void findLocationByCode(initial.sa2).then(found => {
      if (!cancelled && found) setLocation(found);
    });

    return () => {
      cancelled = true;
    };
  }, [initial.sa2]);

  // Replaced rather than pushed, so exploring a scenario does not fill up the
  // back button with every slider position along the way.
  useEffect(() => {
    const query = encodeScenario({ sa2: location?.code, levers, horizonYears, commitmentYears });
    const { pathname, hash } = globalThis.location;

    globalThis.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}${hash}`);
  }, [location, levers, horizonYears, commitmentYears]);

  return {
    location,
    setLocation,
    levers,
    setLevers,
    horizonYears,
    setHorizonYears,
    commitmentYears,
    setCommitmentYears,
    resetLevers: () => setLevers(NO_LEVER_CHANGES),
    resetHorizon: () => {
      setHorizonYears(DEFAULT_HORIZON);
      setCommitmentYears(DEFAULT_COMMITMENT_YEARS);
    },
  };
}
