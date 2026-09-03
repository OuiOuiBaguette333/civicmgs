import { CITATIONS, type Citation } from "@model/evidence";

export const LEVERS = [
  "schoolFunding",
  "employmentServices",
  "housingSupply",
  "healthFunding",
] as const;

export type LeverId = (typeof LEVERS)[number];

export interface Lever {
  id: LeverId;
  label: string;
  /** What moving this slider means in the world, not on the screen. */
  description: string;
  /** Roughly what a 10% move is worth, so the percentage means something. */
  scaleNote?: string;
  scaleSource?: Citation;
}

export const LEVER_MIN = -50;
export const LEVER_MAX = 50;
export const LEVER_STEP = 1;

/**
 * The studies behind the model observed changes of roughly this size. Past it,
 * the projection is straight-line extrapolation into territory nobody measured.
 */
export const WELL_EVIDENCED_CHANGE = 25;

export const LEVERS_BY_ID: Record<LeverId, Lever> = {
  schoolFunding: {
    id: "schoolFunding",
    label: "School funding per student",
    description:
      "A sustained change in recurrent government spending per government-school student.",
    scaleNote:
      "10% is about $2,155 more per student each year, against a national average of $21,550 per full-time student in 2023–24.",
    scaleSource: CITATIONS.rogs2026,
  },
  employmentServices: {
    id: "employmentServices",
    label: "Employment services",
    description: "A sustained change in spending on job-search help, training and wage subsidies.",
  },
  housingSupply: {
    id: "housingSupply",
    label: "New housing supply",
    description: "A sustained change in the rate at which new dwellings are completed.",
  },
  healthFunding: {
    id: "healthFunding",
    label: "Health funding",
    description: "A sustained change in government health spending.",
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
