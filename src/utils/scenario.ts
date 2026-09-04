import { COMMITMENT_YEARS, DEFAULT_COMMITMENT_YEARS } from "@model/cost";
import { LEVER_MAX, LEVER_MIN, LEVERS, type LeverChanges, NO_LEVER_CHANGES } from "@model/levers";
import { DEFAULT_HORIZON, HORIZONS } from "@model/project";
import { clamp } from "@utils";

export interface Scenario {
  /** SA2 code of the selected area, if one is selected. */
  sa2?: string;
  levers: LeverChanges;
  horizonYears: number;
  commitmentYears: number;
}

export const EMPTY_SCENARIO: Scenario = {
  // Spelled out rather than omitted, so a decoded scenario and this have the
  // same shape and can be compared directly.
  sa2: undefined,
  levers: NO_LEVER_CHANGES,
  horizonYears: DEFAULT_HORIZON,
  commitmentYears: DEFAULT_COMMITMENT_YEARS,
};

const SA2_CODE = /^\d{9}$/u;

const readNumber = (params: URLSearchParams, key: string) => {
  const raw = params.get(key);

  if (raw === null || raw.trim() === "") return;

  const value = Number(raw);

  return Number.isFinite(value) ? value : undefined;
};

/**
 * Defaults are left out, so an untouched scenario has no query string at all
 * and a shared link carries only what its author actually changed.
 */
export function encodeScenario(scenario: Scenario): string {
  const params = new URLSearchParams();

  if (scenario.sa2 && SA2_CODE.test(scenario.sa2)) params.set("sa2", scenario.sa2);

  for (const lever of LEVERS) {
    const change = scenario.levers[lever];

    // A dollar commitment divides into a long float; nobody wants to share
    // fifteen decimal places, and three is finer than the model can resolve.
    if (change !== 0) params.set(lever, String(Number(change.toFixed(3))));
  }

  if (scenario.horizonYears !== DEFAULT_HORIZON) {
    params.set("years", String(scenario.horizonYears));
  }

  if (scenario.commitmentYears !== DEFAULT_COMMITMENT_YEARS) {
    params.set("over", String(scenario.commitmentYears));
  }

  return params.toString();
}

/**
 * Nothing arriving from a URL is trusted. Every field is validated against the
 * model's own ranges, and anything missing or malformed falls back to its
 * default rather than reaching the model.
 */
export function decodeScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const sa2 = params.get("sa2");
  const levers = { ...NO_LEVER_CHANGES };

  for (const lever of LEVERS) {
    const change = readNumber(params, lever);

    if (change !== undefined) levers[lever] = clamp(change, LEVER_MIN, LEVER_MAX);
  }

  const horizon = readNumber(params, "years");
  const commitment = readNumber(params, "over");
  const isHorizon = HORIZONS.some(option => option === horizon);
  const isCommitment = COMMITMENT_YEARS.some(option => option === commitment);

  return {
    sa2: sa2 !== null && SA2_CODE.test(sa2) ? sa2 : undefined,
    levers,
    horizonYears: isHorizon && horizon !== undefined ? horizon : DEFAULT_HORIZON,
    commitmentYears:
      isCommitment && commitment !== undefined ? commitment : DEFAULT_COMMITMENT_YEARS,
  };
}
