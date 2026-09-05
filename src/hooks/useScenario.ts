import { DEFAULT_COMMITMENT_YEARS } from "@model/cost";
import { type LeverChanges, NO_LEVER_CHANGES } from "@model/levers";
import { DEFAULT_HORIZON } from "@model/project";
import type { Location } from "@types";
import findLocationByCode from "@utils/findLocation";
import { decodeScenario, encodeScenario } from "@utils/scenario";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * A slider fires on every pointer move. Writing the address bar that often
 * trips Safari's limit of a hundred history writes in thirty seconds, which it
 * enforces by throwing, and Chromium quietly drops the excess so the link can
 * end up describing a lever position from mid-drag. Waiting until the value
 * has been still for a moment avoids both.
 */
const URL_SETTLE_MS = 200;

interface ScenarioQuery {
  sa2?: string;
  levers: LeverChanges;
  horizonYears: number;
  commitmentYears: number;
}

/**
 * Keeps the address bar in step with the scenario. Replaced rather than
 * pushed, so exploring does not fill the back button with every slider
 * position along the way; and written only once the value has been still for
 * a moment, for the reasons above.
 */
function useUrlSync(query: ScenarioQuery) {
  const { sa2, levers, horizonYears, commitmentYears } = query;

  useEffect(() => {
    const timer = setTimeout(() => {
      const encoded = encodeScenario({ sa2, levers, horizonYears, commitmentYears });
      const { pathname, hash, search } = globalThis.location;
      const next = encoded ? `?${encoded}` : "";

      if (next === search) return;

      try {
        globalThis.history.replaceState(null, "", `${pathname}${next}${hash}`);
      } catch {
        // A browser refusing to update the address bar is not a reason to take
        // the page down; the scenario on screen is still correct.
      }
    }, URL_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [sa2, levers, horizonYears, commitmentYears]);
}

/**
 * The suburb a shared link names. The link carries only a code and the name
 * always comes from our own data, so there is a lookup — and until it lands
 * the code is kept as `pending`, so the first URL write does not drop it.
 */
function useLinkedLocation(initialSa2: string | undefined) {
  const [location, setLocationState] = useState<Location | undefined>();
  const [pending, setPending] = useState(initialSa2);

  const setLocation = useCallback((next: Location) => {
    setPending(undefined);
    setLocationState(next);
  }, []);

  useEffect(() => {
    if (!initialSa2) return;

    let cancelled = false;

    findLocationByCode(initialSa2).then(
      found => {
        if (cancelled) return;

        // Never overrule a suburb the reader has picked in the meantime. An
        // unknown code is dropped from the link; a known one is now carried by
        // the location itself.
        if (found) setLocationState(current => current ?? found);

        setPending(undefined);
      },
      () => {
        // The lookup itself failed, most likely the network. Leaving the code
        // in the address bar means a reload gets another chance at it.
      },
    );

    return () => {
      cancelled = true;
    };
  }, [initialSa2]);

  return { location, setLocation, pending };
}

/**
 * Holds everything a shared link carries, and keeps the address bar in step
 * with it so any scenario on screen can be sent to someone else.
 */
export function useScenario() {
  const initial = useMemo(() => decodeScenario(globalThis.location?.search ?? ""), []);

  const { location, setLocation, pending } = useLinkedLocation(initial.sa2);
  const [levers, setLevers] = useState(initial.levers);
  const [horizonYears, setHorizonYears] = useState(initial.horizonYears);
  const [commitmentYears, setCommitmentYears] = useState(initial.commitmentYears);

  useUrlSync({ sa2: location?.code ?? pending, levers, horizonYears, commitmentYears });

  return {
    /** Whether the page was opened on a shared link that names a suburb. */
    openedWithLocation: initial.sa2 !== undefined,
    location,
    setLocation,
    levers,
    setLevers,
    horizonYears,
    setHorizonYears,
    commitmentYears,
    setCommitmentYears,
    /** Back to no change over the default horizon. */
    reset: () => {
      setLevers(NO_LEVER_CHANGES);
      setHorizonYears(DEFAULT_HORIZON);
      setCommitmentYears(DEFAULT_COMMITMENT_YEARS);
    },
  };
}

export type Scenario = ReturnType<typeof useScenario>;
