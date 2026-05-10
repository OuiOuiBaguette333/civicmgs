export const DEMOGRAPHICS = [
  "population",
  "medianAge",
  "medianWeeklyHouseholdIncome",
  "unemploymentRate",
  "rent",
  "personsBornOverseas",
  "year12Completion",
  "nonSchoolQualifications",
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
  year12Completion: "%",
  nonSchoolQualifications: "%",
};

export const DEMOGRAPHICS_LABELS: Record<Demographic, string> = {
  population: "Population",
  medianAge: "Median age",
  medianWeeklyHouseholdIncome: "Median weekly household income",
  unemploymentRate: "Unemployment rate",
  rent: "Median weekly household rent",
  personsBornOverseas: "Persons born overseas",
  year12Completion: "Year 12 completion",
  nonSchoolQualifications: "Non-school qualifications",
};

export const CHANGEABLE_DEMOGRAPHICS: Demographic[] = ["population"];
export const ZEROED_CHANGEABLE_DEMOGRAPHICS = Object.fromEntries(
  CHANGEABLE_DEMOGRAPHICS.map(metric => [metric, 0]),
) as Demographics;
