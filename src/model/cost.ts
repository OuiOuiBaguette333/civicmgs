import type { LeverCostBasis } from "@model/levers";

/** Forward-estimates periods a spending promise is usually announced over. */
export const COMMITMENT_YEARS = [1, 2, 4, 10] as const;

export const DEFAULT_COMMITMENT_YEARS = 4;

export const BILLION = 1_000_000_000;

/**
 * A promise of `dollars` spread evenly over `years`, expressed as the
 * percentage change in annual spending that the model's levers take.
 *
 * Announcements are made in total dollars over a forward-estimates period,
 * which is a different quantity from the sustained annual change the research
 * measures; spreading evenly is the simplest defensible reading of one as the
 * other, and it is the reading this converts.
 */
export function percentFromCommitment(dollars: number, years: number, basis: LeverCostBasis) {
  if (years <= 0 || basis.annualSpend <= 0 || !Number.isFinite(dollars)) return 0;

  return (dollars / years / basis.annualSpend) * 100;
}

/** The inverse: what a sustained percentage change costs over `years`. */
export function commitmentFromPercent(percent: number, years: number, basis: LeverCostBasis) {
  if (years <= 0 || !Number.isFinite(percent)) return 0;

  return (percent / 100) * basis.annualSpend * years;
}
