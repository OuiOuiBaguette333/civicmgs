import { CITATIONS, type Citation } from "@model/evidence";

export const LEVERS = [
  "schoolFunding",
  "employmentServices",
  "housingSupply",
  "healthFunding",
] as const;

export type LeverId = (typeof LEVERS)[number];

/**
 * What a percentage on the slider is worth in dollars, so a spending promise
 * can be entered the way it is announced.
 */
export interface LeverCostBasis {
  /** Annual spending the lever scales, in dollars. */
  annualSpend: number;
  /** How that figure was arrived at, shown to the reader. */
  derivation: string;
  sources: Citation[];
}

export interface Lever {
  id: LeverId;
  label: string;
  /** What moving this slider means in the world, not on the screen. */
  description: string;
  /** Roughly what a 10% move is worth, so the percentage means something. */
  scaleNote?: string;
  scaleSource?: Citation;
  /** Present only where an annual spend can be sourced for this lever. */
  costBasis?: LeverCostBasis;
}

export const LEVER_MIN = -50;
export const LEVER_MAX = 50;
export const LEVER_STEP = 0.5;

/**
 * The studies behind the model observed changes of roughly this size. Past it,
 * the projection is straight-line extrapolation into territory nobody measured.
 */
export const WELL_EVIDENCED_CHANGE = 25;

export const LEVERS_BY_ID: Record<LeverId, Lever> = {
  schoolFunding: {
    id: "schoolFunding",
    label: "School funding per student",
    description: "Recurrent government spending per government-school student.",
    scaleNote:
      "10% is about $2,155 more a year, against a national average of $21,550 per full-time student in 2023–24.",
    scaleSource: CITATIONS.rogs2026,
    costBasis: {
      // 661,326.7 FTE students x $21,550 per student.
      annualSpend: 14_251_590_385,
      derivation:
        "661,326.7 full-time equivalent students in Victorian government schools at the February 2024 census, at $21,550 per student in government recurrent expenditure. The per-student figure is the national average for 2023–24 excluding user cost of capital, because the state breakdown is published only in the report's data tables.",
      sources: [CITATIONS.vicSchoolStudents2025, CITATIONS.rogs2026],
    },
  },
  employmentServices: {
    id: "employmentServices",
    label: "Employment services",
    description: "Spending on job-search help, training and wage subsidies.",
  },
  housingSupply: {
    id: "housingSupply",
    label: "New housing supply",
    description: "The rate at which new dwellings are completed.",
  },
  healthFunding: {
    id: "healthFunding",
    label: "Health funding",
    description: "Government health spending.",
  },
};

export type LeverChanges = Record<LeverId, number>;

/**
 * Written out rather than derived, so adding a lever is a type error here
 * instead of an undefined slider later.
 */
export const NO_LEVER_CHANGES: LeverChanges = {
  schoolFunding: 0,
  employmentServices: 0,
  housingSupply: 0,
  healthFunding: 0,
};
