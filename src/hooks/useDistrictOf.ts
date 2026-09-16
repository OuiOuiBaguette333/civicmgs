import { useLazyData } from "@hooks/useLazyData";
import type { Electorate } from "@model/electorates";

export interface District {
  name: string;
  region?: string;
}

const load = (): Promise<Map<string, District>> =>
  import("@data/abs/SED_VIC.json").then(
    ({ default: districts }) =>
      new Map(
        (districts as Electorate[]).flatMap(district =>
          district.areas.map(code => [code, { name: district.name, region: district.region }]),
        ),
      ),
  );

/**
 * The district a suburb's centre falls in, once the small join file has
 * loaded; nothing until then, and nothing for a suburb outside every district.
 */
export function useDistrictOf(code?: string): District | undefined {
  const { state } = useLazyData(load, code !== undefined);

  return code !== undefined && state.status === "ready" ? state.data.get(code) : undefined;
}
