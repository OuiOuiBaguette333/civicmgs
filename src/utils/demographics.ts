export const DEMOGRAPHICS = [
  "population",
  "medianAge",
  "medianEquivalisedHouseholdIncome",
  "unemploymentRate",
  "rent",
  "bornOverseasShare",
  "year12Completion",
  "nonSchoolQualifications",
] as const;

export type Demographic = (typeof DEMOGRAPHICS)[number];

export type Demographics = Record<Demographic, number>;

/**
 * The ABS suppresses measures for small or unusual areas, so any individual
 * metric can be missing. Callers must handle that rather than read a zero.
 */
export type PartialDemographics = Partial<Demographics>;

export type DemographicFormat = "count" | "currency" | "percent" | "years";

/** Which direction counts as an improvement, where that is uncontested. */
export type DemographicDirection = "higher" | "lower" | "neutral";

export interface DemographicMeta {
  label: string;
  format: DemographicFormat;
  direction: DemographicDirection;
  /**
   * Whether an area figure can be meaningfully compared with the state figure.
   * Counts cannot: a suburb's population against Victoria's total says nothing.
   */
  comparable: boolean;
  /** Shown under the value where the measure's name alone would mislead. */
  note?: string;
}

export const DEMOGRAPHICS_META: Record<Demographic, DemographicMeta> = {
  population: {
    label: "Population",
    format: "count",
    direction: "neutral",
    comparable: false,
    note: "Estimated resident population",
  },
  medianAge: {
    label: "Median age",
    format: "years",
    direction: "neutral",
    comparable: true,
  },
  medianEquivalisedHouseholdIncome: {
    label: "Median household income",
    format: "currency",
    direction: "higher",
    comparable: true,
    note: "Weekly, equivalised for household size",
  },
  unemploymentRate: {
    label: "Unemployment rate",
    format: "percent",
    direction: "lower",
    comparable: true,
  },
  rent: {
    // Lower rent is better for renters and worse for landlords, so this is left
    // undirected rather than quietly taking a side.
    label: "Median weekly rent",
    format: "currency",
    direction: "neutral",
    comparable: true,
  },
  bornOverseasShare: {
    label: "Residents born overseas",
    format: "percent",
    direction: "neutral",
    comparable: true,
    note: "Share of the estimated resident population",
  },
  year12Completion: {
    label: "Year 12 completion",
    format: "percent",
    direction: "higher",
    comparable: true,
  },
  nonSchoolQualifications: {
    label: "Non-school qualifications",
    format: "percent",
    direction: "higher",
    comparable: true,
  },
};

export const DEMOGRAPHICS_LABELS = Object.fromEntries(
  DEMOGRAPHICS.map(metric => [metric, DEMOGRAPHICS_META[metric].label]),
) as Record<Demographic, string>;

/** Metrics a slider is currently allowed to move. */
export const CHANGEABLE_DEMOGRAPHICS = ["population", "medianEquivalisedHouseholdIncome"] as const;

export type ChangeableDemographic = (typeof CHANGEABLE_DEMOGRAPHICS)[number];

/** Percentage change applied to each changeable metric. */
export type SimulatedChanges = Record<ChangeableDemographic, number>;

/**
 * Written out rather than derived, so that adding a metric to
 * CHANGEABLE_DEMOGRAPHICS is a type error here instead of a missing key later.
 */
export const NO_SIMULATED_CHANGES: SimulatedChanges = {
  population: 0,
  medianEquivalisedHouseholdIncome: 0,
};

const CHANGEABLE = new Set<string>(CHANGEABLE_DEMOGRAPHICS);

export function isChangeable(metric: Demographic): metric is ChangeableDemographic {
  return CHANGEABLE.has(metric);
}
