import { type Effect, EFFECTS, isQuantified, type QuantifiedEffect } from "@model/effects";
import type { LeverChanges, LeverId } from "@model/levers";
import { projectOutcome } from "@model/project";
import type { Demographic } from "@utils/demographics";

/** How far either side a timing assumption is moved to test its leverage. */
export const TIMING_VARIATION = 0.25;

/** Whether a parameter's range comes from research or from this project. */
export type SensitivityBasis = "evidence" | "assumption";

export interface Sensitivity {
  key: string;
  lever: LeverId;
  label: string;
  basis: SensitivityBasis;
  /** What was varied, and over what range. */
  note: string;
  /** Projected central value with the parameter at each end of its range. */
  atLow: number;
  atHigh: number;
  min: number;
  max: number;
  /** How far the answer moves. The whole point of the exercise. */
  spread: number;
}

const replaceAt = (effects: Effect[], index: number, replacement: Effect) =>
  effects.map((effect, position) => (position === index ? replacement : effect));

/**
 * Varies one parameter at a time and reports how far the answer moves.
 *
 * The ranking is worth reading rather than guessing: a lag and a phase-in do
 * not have fixed importance. Early in a projection the lag dominates, because
 * the elapsed time since it ended is small and a year either way is a large
 * share of it. Late on, the phase-in takes over. So which assumption is load
 * bearing depends on the horizon being asked about.
 */
export function sensitivities(
  outcome: Demographic,
  baseline: number,
  levers: LeverChanges,
  horizonYears: number,
  effects: Effect[] = EFFECTS,
): Sensitivity[] {
  const central = (candidates: Effect[]) =>
    projectOutcome(outcome, baseline, levers, horizonYears, candidates).projected.central;

  const rows: Sensitivity[] = [];

  for (const [index, effect] of effects.entries()) {
    if (effect.outcome !== outcome || levers[effect.lever] === 0 || !isQuantified(effect)) continue;

    const { magnitude, lagYears, phaseInYears } = effect as QuantifiedEffect;
    const near = 1 - TIMING_VARIATION;
    const far = 1 + TIMING_VARIATION;

    const variants: {
      key: string;
      label: string;
      basis: SensitivityBasis;
      note: string;
      low: Effect;
      high: Effect;
    }[] = [
      {
        key: "magnitude",
        label: "Effect size",
        basis: "evidence",
        note: "the study's own low and high estimates",
        low: { ...effect, magnitude: { ...magnitude, central: magnitude.low } },
        high: { ...effect, magnitude: { ...magnitude, central: magnitude.high } },
      },
      {
        key: "lag",
        label: "Lag",
        basis: "assumption",
        note: `${lagYears} years before anything appears, varied by a quarter`,
        low: { ...effect, lagYears: lagYears * near },
        high: { ...effect, lagYears: lagYears * far },
      },
      {
        key: "phaseIn",
        label: "Phase-in",
        basis: "assumption",
        note: `${phaseInYears} years to reach everyone counted, varied by a quarter`,
        low: { ...effect, phaseInYears: phaseInYears * near },
        high: { ...effect, phaseInYears: phaseInYears * far },
      },
    ];

    for (const variant of variants) {
      const atLow = central(replaceAt(effects, index, variant.low));
      const atHigh = central(replaceAt(effects, index, variant.high));

      rows.push({
        key: `${effect.lever}-${variant.key}`,
        lever: effect.lever,
        label: variant.label,
        basis: variant.basis,
        note: variant.note,
        atLow,
        atHigh,
        min: Math.min(atLow, atHigh),
        max: Math.max(atLow, atHigh),
        spread: Math.abs(atHigh - atLow),
      });
    }
  }

  return rows.toSorted((a, b) => b.spread - a.spread);
}

/** The value range every row must be drawn against, so the bars are comparable. */
export function sensitivityDomain(rows: Sensitivity[], central: number) {
  const values = [central, ...rows.flatMap(row => [row.min, row.max])];

  return { min: Math.min(...values), max: Math.max(...values) };
}
