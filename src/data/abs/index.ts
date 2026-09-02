export const SA2_INFO_LINK =
  "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/main-structure-and-greater-capital-city-statistical-areas/statistical-area-level-2";

/** SDMX dataflow every figure in the app is read from. */
export const ABS_DATAFLOW = "ABS,ABS_REGIONAL_ASGS2021";

/** Reference year requested for every measure. */
export const YEAR = 2021;

/** ASGS 2021 region types, used as the second key position in a data query. */
export const REGION_TYPES = {
  sa2: "SA2",
  state: "STE",
} as const;

/** ASGS 2021 state code for Victoria, which every area is compared against. */
export const VICTORIA_CODE = "2";
