import { useLazyData } from "@hooks/useLazyData";
import type { AreaFigures, Electorate, ElectorateSummary } from "@model/electorates";
import { summariseAll } from "@model/electorates";

export interface ElectorateData {
  electorates: ElectorateSummary[];
  /** SA2 code to suburb name, for the suburb list inside each district. */
  names: Map<string, string>;
  figures: AreaFigures;
}

const load = (): Promise<ElectorateData> =>
  Promise.all([
    import("@data/abs/SED_VIC.json"),
    import("@data/abs/SA2_VIC_metrics.json"),
    import("@data/abs/SA2_VIC.json"),
  ]).then(([districts, metrics, areas]) => {
    const figures = metrics.default as AreaFigures;

    return {
      electorates: summariseAll(districts.default as Electorate[], figures),
      names: new Map(
        areas.default.flatMap(group =>
          group.options.map(({ label, value }) => [value, label] as const),
        ),
      ),
      figures,
    };
  });

/**
 * The district-to-suburb join, the census figures and the suburb names, loaded
 * on demand. Together they are a few hundred kB, which is worth deferring past
 * the first paint but cheap enough to hold once.
 */
export const useElectorates = () => useLazyData(load);
