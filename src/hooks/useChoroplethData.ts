import type { Demographic } from "@utils/demographics";
import { useEffect, useState } from "react";

export interface AreaShape {
  code: string;
  name: string;
  d: string;
}

interface ChoroplethData {
  viewBox: string;
  shapes: AreaShape[];
  values: Record<string, Partial<Record<Demographic, number>>>;
}

type State = { status: "loading" } | { status: "ready"; data: ChoroplethData };

/**
 * Both files are built offline and loaded on demand, so the map's ~230 kB of
 * geometry never delays the first paint.
 */
export function useChoroplethData() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      import("@data/abs/SA2_VIC_shapes.json"),
      import("@data/abs/SA2_VIC_metrics.json"),
    ]).then(([shapes, values]) => {
      if (cancelled) return;

      setState({
        status: "ready",
        data: {
          viewBox: shapes.default.viewBox,
          shapes: shapes.default.shapes,
          values: values.default as ChoroplethData["values"],
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
