import type { Location } from "@types";
import type { PartialDemographics } from "@utils/demographics";
import {
  AbsApiError,
  fetchAreaDemographics,
  fetchVictorianDemographics,
} from "@utils/fetchDemographics";
import { useCallback, useEffect, useState } from "react";

export type RegionDemographics =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; area: PartialDemographics; victoria: PartialDemographics };

type SettledDemographics = Extract<RegionDemographics, { status: "error" | "ready" }>;

const GENERIC_ERROR = "Something went wrong loading this area.";

/**
 * Derived while rendering rather than stored, so selecting an area shows the
 * loading state immediately instead of after a second render.
 */
function deriveState(
  requestKey: string | undefined,
  settled: { key: string; value: SettledDemographics } | null,
): RegionDemographics {
  if (!requestKey) return { status: "idle" };
  if (settled?.key === requestKey) return settled.value;

  return { status: "loading" };
}

/**
 * Loads an area and the Victorian baseline together, cancelling in-flight
 * requests when the selection changes.
 */
export function useRegionDemographics(location?: Location) {
  const [settled, setSettled] = useState<{ key: string; value: SettledDemographics } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Folding the retry counter into the key makes "load this again" a new
  // request rather than an extra effect dependency that does nothing.
  const requestKey = location && `${location.code}#${attempt}`;

  useEffect(() => {
    if (!location || !requestKey) return;

    const controller = new AbortController();

    const settle = (value: SettledDemographics) => {
      if (controller.signal.aborted) return;
      setSettled({ key: requestKey, value });
    };

    Promise.all([
      fetchAreaDemographics(location.code, controller.signal),
      fetchVictorianDemographics(controller.signal),
    ])
      .then(([area, victoria]) => settle({ status: "ready", area, victoria }))
      .catch((error: unknown) =>
        settle({
          status: "error",
          message: error instanceof AbsApiError ? error.message : GENERIC_ERROR,
        }),
      );

    return () => controller.abort();
  }, [location, requestKey]);

  const retry = useCallback(() => setAttempt(current => current + 1), []);

  return { state: deriveState(requestKey, settled), retry };
}
