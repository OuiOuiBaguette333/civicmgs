import { useEffect, useState } from "react";

/**
 * The fine outlines are about a megabyte — four times the whole-state set — so
 * they are fetched only once someone zooms in far enough to tell the
 * difference, and never at all for a reader who just looks at Victoria.
 */
export function useDetailShapes(wanted: boolean) {
  const [paths, setPaths] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!wanted || paths) return;

    let cancelled = false;

    void import("@data/abs/SA2_VIC_shapes_detail.json").then(module => {
      if (!cancelled) setPaths(module.default as Record<string, string>);
    });

    return () => {
      cancelled = true;
    };
  }, [wanted, paths]);

  return paths;
}
