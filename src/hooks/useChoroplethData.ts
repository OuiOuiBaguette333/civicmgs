import { useLazyData } from "@hooks/useLazyData";
import type { Demographic } from "@utils/demographics";

export interface AreaShape {
  code: string;
  name: string;
  d: string;
}

export interface ChoroplethData {
  viewBox: string;
  shapes: AreaShape[];
  values: Record<string, Partial<Record<Demographic, number>>>;
}

const load = (): Promise<ChoroplethData> =>
  Promise.all([
    import("@data/abs/SA2_VIC_shapes.json"),
    import("@data/abs/SA2_VIC_metrics.json"),
  ]).then(([shapes, values]) => ({
    viewBox: shapes.default.viewBox,
    shapes: shapes.default.shapes,
    values: values.default as ChoroplethData["values"],
  }));

/**
 * Both files are built offline and loaded on demand, so the map's ~230 kB of
 * geometry never delays the first paint.
 */
export const useChoroplethData = () => useLazyData(load);
