export const DEMOGRAPHICS = [
  "population",
  "medianAge",
  "medianWeeklyHouseholdIncome",
  "unemploymentRate",
  "rent",
] as const;

export type Demographic = (typeof DEMOGRAPHICS)[number];

export type Demographics = {
  [Metric in Demographic]: number;
};

export const DEMOGRAPHICS_FORMATS: Partial<Record<Demographic, string>> = {
  medianAge: "years",
  medianWeeklyHouseholdIncome: "$",
  unemploymentRate: "%",
  rent: "$",
};

export const DEMOGRAPHICS_LABELS: Record<Demographic, string> = {
  population: "Population",
  medianAge: "Median age",
  medianWeeklyHouseholdIncome: "Median weekly household income",
  unemploymentRate: "Unemployment rate",
  rent: "Median weekly household rent",
};

export const CHANGEABLE_DEMOGRAPHICS: Demographic[] = ["population"];
export const ZEROED_CHANGEABLE_DEMOGRAPHICS = Object.fromEntries(
  CHANGEABLE_DEMOGRAPHICS.map(metric => [metric, 0]),
) as Demographics;
