import { type Band, type Citation, CITATIONS, type EvidenceStrength } from "@model/evidence";
import type { LeverId } from "@model/levers";
import type { Demographic } from "@utils/demographics";

/** "relative" is a percentage of the metric's own value; "absolute" is percentage points. */
export type EffectKind = "relative" | "absolute";

interface EffectBase {
  lever: LeverId;
  outcome: Demographic;
  /** What the study actually measured, and any conversion made to reach this metric. */
  derivation: string;
  /** Years before any of the effect can show up in this metric. */
  lagYears: number;
  /** Years from the end of the lag for the effect to reach its full size. */
  phaseInYears: number;
  /**
   * Why those two numbers. Lags are CivicLens's structural assumptions about how
   * long a change takes to reach a census measure, not findings of the study.
   */
  timingNote: string;
  citation: Citation;
  supporting?: Citation[];
}

export interface QuantifiedEffect extends EffectBase {
  strength: Extract<EvidenceStrength, "strong" | "moderate">;
  magnitude: Band;
  kind: EffectKind;
  /** The lever change, in percent, that `magnitude` is stated for. */
  perLeverChange: number;
}

export interface DirectionalEffect extends EffectBase {
  strength: Extract<EvidenceStrength, "direction-only">;
  direction: "up" | "down";
}

export type Effect = QuantifiedEffect | DirectionalEffect;

export function isQuantified(effect: Effect): effect is QuantifiedEffect {
  return effect.strength !== "direction-only";
}

/**
 * Every link the model knows about. A lever with no entry here moves nothing,
 * which is the honest answer for most of what gets promised.
 *
 * Each band's central value is the study's own estimate. Where a low bound is
 * CivicLens's own conservative floor for carrying an overseas estimate to
 * Australia, the derivation says so.
 */
export const EFFECTS: Effect[] = [
  {
    lever: "schoolFunding",
    outcome: "year12Completion",
    strength: "moderate",
    kind: "absolute",
    perLeverChange: 10,
    magnitude: { low: 3, central: 9.5, high: 11.6 },
    derivation:
      "The study finds a 10% rise in per-pupil spending across all 12 school years raises the probability of high-school graduation by 9.5 percentage points, and by 11.6 points for low-income children. The low bound of 3 points is not from the study: it is a conservative floor for carrying a United States estimate to Victoria. This metric is the share of all adults who finished Year 12, not a single cohort's graduation rate.",
    lagYears: 13,
    phaseInYears: 55,
    timingNote:
      "A child starting school today finishes Year 12 in about 13 years, and it takes roughly a further 55 years for those cohorts to replace the adult population the census counts.",
    citation: CITATIONS.jacksonJohnsonPersico2016,
  },
  {
    lever: "schoolFunding",
    outcome: "medianEquivalisedHouseholdIncome",
    strength: "strong",
    kind: "relative",
    perLeverChange: 10,
    magnitude: { low: 2, central: 7.25, high: 9.5 },
    derivation:
      "The study finds a 10% rise in per-pupil spending across all 12 school years raises adult wages by 7.25%, and by 9.5% for low-income children. The low bound of 2% is a conservative floor for cross-country transfer, not a reported estimate. Adult wages are not the same thing as equivalised household income.",
    lagYears: 18,
    phaseInYears: 45,
    timingNote:
      "Exposed cohorts have to finish school and reach working age before any of this reaches a household income figure.",
    citation: CITATIONS.jacksonJohnsonPersico2016,
    supporting: [CITATIONS.leigh2025],
  },
  {
    lever: "schoolFunding",
    outcome: "nonSchoolQualifications",
    strength: "moderate",
    kind: "absolute",
    perLeverChange: 10,
    magnitude: { low: 1.5, central: 6, high: 9 },
    derivation:
      "The meta-analysis finds $1,000 more per pupil sustained for four years raises college-going by 2.8 percentage points. Scaling that to a 10% increase uses the national average of $21,550 per full-time student, giving about 6 points. Both the straight-line scaling and the step from going to college to holding a qualification are assumptions the meta-analysis does not test.",
    lagYears: 18,
    phaseInYears: 50,
    timingNote:
      "A post-school qualification arrives several years after Year 12, and then only enters the census count as those cohorts age into the adult population.",
    citation: CITATIONS.jacksonMackevicius2024,
    supporting: [CITATIONS.rogs2026],
  },
  {
    lever: "schoolFunding",
    outcome: "unemploymentRate",
    strength: "direction-only",
    direction: "down",
    derivation:
      "The study measures adult poverty, down 3.67 percentage points for a 10% spending rise, and Australian work finds higher attainment raises earnings. Neither estimates what happens to an area's unemployment rate, so no number is projected here.",
    lagYears: 18,
    phaseInYears: 45,
    timingNote: "Same cohort timing as the income link.",
    citation: CITATIONS.jacksonJohnsonPersico2016,
    supporting: [CITATIONS.leigh2025],
  },
  {
    lever: "employmentServices",
    outcome: "unemploymentRate",
    strength: "direction-only",
    direction: "down",
    derivation:
      "Across more than 200 evaluations, average impacts are close to zero in the short run and become more positive two to three years after a programme finishes, with human-capital programmes strongest. The meta-analysis reports no effect size that converts into an area's unemployment rate.",
    lagYears: 2,
    phaseInYears: 5,
    timingNote: "The meta-analysis finds effects emerging two to three years after programmes end.",
    citation: CITATIONS.cardKluveWeber2018,
  },
  {
    lever: "housingSupply",
    outcome: "rent",
    strength: "direction-only",
    direction: "down",
    derivation:
      "New supply lowers rents in the month it reaches the market, and the effect fades within about a year. It is estimated on monthly rental listings in Munich, and nothing in it transfers to a Victorian suburb or to a census rent figure.",
    lagYears: 1,
    phaseInYears: 3,
    timingNote:
      "Dwellings take time to build, and the measured effect is short-lived once they land.",
    citation: CITATIONS.mense2025,
  },
];

export const effectsForLever = (lever: LeverId) => EFFECTS.filter(effect => effect.lever === lever);

export const effectsForOutcome = (outcome: Demographic) =>
  EFFECTS.filter(effect => effect.outcome === outcome);
