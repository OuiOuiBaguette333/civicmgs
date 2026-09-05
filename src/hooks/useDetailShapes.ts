import { useLazyData } from "@hooks/useLazyData";

const load = () =>
  import("@data/abs/SA2_VIC_shapes_detail.json").then(
    module => module.default as Record<string, string>,
  );

/**
 * The fine outlines are about a megabyte — four times the whole-state set — so
 * they are fetched only once someone zooms in far enough to tell the
 * difference, and never at all for a reader who just looks at Victoria.
 *
 * If they fail to arrive the map simply stays on the coarse outlines: they are
 * an improvement, not a requirement, so there is nothing to report.
 */
export function useDetailShapes(wanted: boolean) {
  const { state } = useLazyData(load, wanted);

  return state.status === "ready" ? state.data : null;
}
