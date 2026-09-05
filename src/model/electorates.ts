import { DEMOGRAPHICS, DEMOGRAPHICS_META, type Demographic } from "@utils/demographics";

export interface Electorate {
  code: string;
  name: string;
  /** The Legislative Council region the district sits in. */
  region?: string;
  /** SA2 codes whose centroid falls in this district. */
  areas: string[];
}

export type AreaFigures = Record<string, Partial<Record<Demographic, number>>>;

export interface ElectorateSummary extends Electorate {
  figures: Partial<Record<Demographic, number>>;
  /** Suburbs the ABS publishes nothing for, so coverage is visible. */
  withoutFigures: number;
}

/** Metrics that are a median of a suburb, and cannot honestly be averaged. */
const MEDIANS = new Set<Demographic>(
  DEMOGRAPHICS.filter(
    metric => DEMOGRAPHICS_META[metric].format !== "percent" && metric !== "population",
  ),
);

export const isAveragedMedian = (metric: Demographic) => MEDIANS.has(metric);

/**
 * Rolls a district's suburbs into one set of figures.
 *
 * Population is a true sum. Rates are weighted by population, which is right.
 * Medians are not: the population-weighted mean of suburb medians is not the
 * district's median, and no amount of arithmetic on these inputs can produce
 * one — the ABS publishes the median per area, not the distribution behind it.
 * Those metrics are still shown, flagged, because leaving income off an
 * electorate card would be a stranger choice than labelling it.
 */
export function summarise(electorate: Electorate, figures: AreaFigures): ElectorateSummary {
  const present = electorate.areas.map(code => figures[code]).filter(area => area !== undefined);
  const totals: Partial<Record<Demographic, number>> = {};

  const population = present.reduce((sum, area) => sum + (area.population ?? 0), 0);

  if (population > 0) totals.population = population;

  for (const metric of DEMOGRAPHICS) {
    if (metric === "population") continue;

    let weighted = 0;
    let weight = 0;

    for (const area of present) {
      const value = area[metric];
      const areaPopulation = area.population;

      if (value === undefined || !areaPopulation) continue;

      weighted += value * areaPopulation;
      weight += areaPopulation;
    }

    if (weight > 0) totals[metric] = weighted / weight;
  }

  return {
    ...electorate,
    figures: totals,
    withoutFigures: electorate.areas.length - present.length,
  };
}

export const summariseAll = (electorates: Electorate[], figures: AreaFigures) =>
  electorates.map(electorate => summarise(electorate, figures));
