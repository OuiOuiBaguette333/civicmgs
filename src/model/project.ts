import {
  type DirectionalEffect,
  type Effect,
  EFFECTS,
  isQuantified,
  type QuantifiedEffect,
} from "@model/effects";
import type { Band } from "@model/evidence";
import type { LeverChanges } from "@model/levers";
import { clamp } from "@utils";
import {
  type Demographic,
  DEMOGRAPHICS_META,
  type DemographicFormat,
  type PartialDemographics,
} from "@utils/demographics";

export const HORIZONS = [10, 20, 30, 50] as const;
export const DEFAULT_HORIZON = 20;

export interface Contribution {
  effect: QuantifiedEffect;
  leverChange: number;
  /** Share of the measured population the change has reached by the horizon. */
  exposure: number;
  band: Band;
}

export interface Projection {
  outcome: Demographic;
  baseline: number;
  projected: Band;
  /** Links that moved the number, each with the study behind it. */
  contributions: Contribution[];
  /** Active links where research gives a direction but no usable size. */
  unquantified: DirectionalEffect[];
  /** True when nothing the model knows about touches this metric. */
  unchanged: boolean;
}

const BOUNDS: Record<DemographicFormat, { min: number; max: number }> = {
  percent: { min: 0, max: 100 },
  count: { min: 0, max: Number.POSITIVE_INFINITY },
  currency: { min: 0, max: Number.POSITIVE_INFINITY },
  years: { min: 0, max: Number.POSITIVE_INFINITY },
};

/**
 * The share of the population a census metric counts that has actually lived
 * through the change by the horizon. Without this a funding change would appear
 * to rewrite the whole adult population's schooling overnight, when in truth it
 * reaches one school cohort at a time.
 */
export function exposure(horizonYears: number, lagYears: number, phaseInYears: number) {
  const elapsed = horizonYears - lagYears;

  if (elapsed <= 0) return 0;
  if (phaseInYears <= 0) return 1;

  return Math.min(elapsed / phaseInYears, 1);
}

function contributionBand(
  effect: QuantifiedEffect,
  baseline: number,
  leverChange: number,
  horizonYears: number,
): Band {
  const reach = exposure(horizonYears, effect.lagYears, effect.phaseInYears);
  const scale = (leverChange / effect.perLeverChange) * reach;

  const toDelta = (magnitude: number) =>
    effect.kind === "relative" ? baseline * (magnitude / 100) * scale : magnitude * scale;

  const bounds = [toDelta(effect.magnitude.low), toDelta(effect.magnitude.high)];

  // A cut in the lever flips the band, so the ends are sorted rather than assumed.
  return {
    low: Math.min(...bounds),
    central: toDelta(effect.magnitude.central),
    high: Math.max(...bounds),
  };
}

const addBands = (a: Band, b: Band): Band => ({
  low: a.low + b.low,
  central: a.central + b.central,
  high: a.high + b.high,
});

const NO_CHANGE: Band = { low: 0, central: 0, high: 0 };

/**
 * Effects are summed rather than compounded: each is a first-order estimate of
 * one lever's own influence, and chaining them would multiply small numbers
 * into confident nonsense.
 */
export function projectOutcome(
  outcome: Demographic,
  baseline: number,
  levers: LeverChanges,
  horizonYears: number,
  effects: Effect[] = EFFECTS,
): Projection {
  const active = effects.filter(effect => effect.outcome === outcome && levers[effect.lever] !== 0);

  const contributions = active
    .filter(effect => isQuantified(effect))
    .map(effect => ({
      effect,
      leverChange: levers[effect.lever],
      exposure: exposure(horizonYears, effect.lagYears, effect.phaseInYears),
      band: contributionBand(effect, baseline, levers[effect.lever], horizonYears),
    }));

  const total = contributions.reduce((running, { band }) => addBands(running, band), NO_CHANGE);
  const { min, max } = BOUNDS[DEMOGRAPHICS_META[outcome].format];
  const bound = (value: number) => clamp(baseline + value, min, max);

  return {
    outcome,
    baseline,
    projected: { low: bound(total.low), central: bound(total.central), high: bound(total.high) },
    contributions,
    unquantified: active.filter(effect => !isQuantified(effect)),
    unchanged: active.length === 0,
  };
}

export function project(
  demographics: PartialDemographics,
  levers: LeverChanges,
  horizonYears: number,
  effects: Effect[] = EFFECTS,
) {
  const projections = {} as Partial<Record<Demographic, Projection>>;

  for (const [outcome, baseline] of Object.entries(demographics) as [Demographic, number][]) {
    projections[outcome] = projectOutcome(outcome, baseline, levers, horizonYears, effects);
  }

  return projections;
}

export const hasAnyLeverChange = (levers: LeverChanges) =>
  Object.values(levers).some(change => change !== 0);
