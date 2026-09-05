// Turns an ABS SA2 boundary file into pre-projected SVG paths, at two levels
// of detail.
//
//   npm run data:shapes -- [path-to-geojson]
//
// Simplification runs over a *topology* rather than over each polygon. Two
// neighbours share one border; simplifying their copies of it independently
// leaves each drawing a different straight-line approximation, and the
// mismatch shows as slivers of background between them when zoomed in.
// Extracting shared arcs first means a border is simplified once and both
// polygons rebuild from the same points, so the map tessellates at any
// tolerance.
//
// Projecting here rather than in the browser means the app ships path strings
// and needs no geographic libraries at all.

import { writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

import { geoMercator } from "d3-geo";
import { feature } from "topojson-client";
import { topology } from "topojson-server";
import { planarTriangleArea, presimplify, simplify } from "topojson-simplify";

import { streamFeatures } from "./streamFeatures.ts";

type Position = [number, number];

interface Feature {
  properties?: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown } | null;
}

const INPUT = process.argv[2] ?? "raw-sa2.geojson";
const OUTPUT_COARSE = "../src/data/abs/SA2_VIC_shapes.json";
const OUTPUT_DETAIL = "../src/data/abs/SA2_VIC_shapes_detail.json";

/** Victorian SA2 codes all begin with the state's ASGS code. */
const VICTORIA_PREFIX = "2";

const WIDTH = 800;
const HEIGHT = 560;
const PADDING = 8;

/**
 * Minimum triangle area, in square pixels of the whole-state view, for a point
 * to survive. The coarse level is what loads first; the detail level is fetched
 * only once someone zooms in.
 */
const COARSE_WEIGHT = 0.12;
const DETAIL_WEIGHT = 0.0015;

/** Sub-pixel precision is invisible, and dropping it before building the
 *  topology saves a great deal of memory on a file this size. */
const INGEST_PRECISION = 2;

const CODE_KEYS = ["SA2_CODE_2021", "sa2_code_2021", "SA2_CODE21", "SA2_MAIN21"];
const NAME_KEYS = ["SA2_NAME_2021", "sa2_name_2021", "SA2_NAME21"];

const pick = (properties: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    if (!properties) return;

    const value = properties[key];

    if (typeof value === "string" && value !== "") return value;
  }
};

const ringsOf = (geometry: Feature["geometry"]): Position[][] => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates as Position[][];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates as Position[][][]).flat();

  return [];
};

const isVictorian = (candidate: Feature) =>
  pick(candidate.properties, CODE_KEYS)?.startsWith(VICTORIA_PREFIX) === true &&
  candidate.geometry !== null;

const inputPath = resolvePath(process.cwd(), INPUT);

// Pass one: the extent, so the projection is fitted before anything is
// projected. Only four numbers are kept, whatever the file's size.
let minLongitude = Infinity;
let minLatitude = Infinity;
let maxLongitude = -Infinity;
let maxLatitude = -Infinity;
let found = 0;

for await (const item of streamFeatures<Feature>(inputPath)) {
  if (!isVictorian(item)) continue;

  found += 1;

  for (const ring of ringsOf(item.geometry)) {
    for (const [longitude, latitude] of ring) {
      minLongitude = Math.min(minLongitude, longitude);
      maxLongitude = Math.max(maxLongitude, longitude);
      minLatitude = Math.min(minLatitude, latitude);
      maxLatitude = Math.max(maxLatitude, latitude);
    }
  }
}

if (found === 0) throw new Error(`No Victorian SA2 features found in ${inputPath}.`);

/**
 * Fitted to the raw extent rather than to the features. d3's geoPath reads a
 * clockwise ring as covering the rest of the planet, and boundary exports do
 * not guarantee winding order — a bounding box of plain points cannot be
 * misread that way. Mercator rather than a conic: across one state the
 * distortion is imperceptible, and it stays monotonic in latitude.
 */
const projection = geoMercator().fitExtent(
  [
    [PADDING, PADDING],
    [WIDTH - PADDING, HEIGHT - PADDING],
  ],
  {
    type: "MultiPoint",
    coordinates: [
      [minLongitude, minLatitude],
      [maxLongitude, maxLatitude],
    ],
  } as never,
);

const round = (value: number, places: number) => Number(value.toFixed(places));

/** Projects a ring, dropping points that round onto their predecessor. */
function projectRing(ring: Position[]): Position[] {
  const out: Position[] = [];

  for (const position of ring) {
    const projected = projection(position);

    if (!projected) continue;

    const point: Position = [
      round(projected[0], INGEST_PRECISION),
      round(projected[1], INGEST_PRECISION),
    ];
    const last = out.at(-1);

    if (!last || last[0] !== point[0] || last[1] !== point[1]) out.push(point);
  }

  return out;
}

// Pass two: project every Victorian feature into pixel space, so the topology
// and its tolerances are both in the units the map is drawn in.
const projected: {
  type: "Feature";
  properties: { code: string; name: string };
  geometry: { type: "MultiPolygon"; coordinates: Position[][][] };
}[] = [];

for await (const item of streamFeatures<Feature>(inputPath)) {
  if (!isVictorian(item)) continue;

  const code = pick(item.properties, CODE_KEYS)!;
  const rings = ringsOf(item.geometry)
    .map(ring => projectRing(ring))
    .filter(ring => ring.length >= 4);

  if (rings.length === 0) continue;

  projected.push({
    type: "Feature",
    properties: { code, name: pick(item.properties, NAME_KEYS) ?? code },
    geometry: { type: "MultiPolygon", coordinates: rings.map(ring => [ring]) },
  });
}

const built = topology({ areas: { type: "FeatureCollection", features: projected } } as never);
const weighted = presimplify(built as never, planarTriangleArea);

/** Absolute move, then relative lines: the deltas are small numbers, which is
 *  most of a third off the file compared with absolute coordinates. */
function toPath(rings: Position[][]) {
  const parts: string[] = [];

  for (const ring of rings) {
    let cursorX = 0;
    let cursorY = 0;

    for (const [index, [x, y]] of ring.entries()) {
      if (index === 0) {
        cursorX = round(x, 1);
        cursorY = round(y, 1);
        parts.push(`M${cursorX} ${cursorY}`);
        continue;
      }

      const dx = round(x - cursorX, 1);
      const dy = round(y - cursorY, 1);

      if (dx === 0 && dy === 0) continue;

      // Advanced by the rounded delta, so error cannot accumulate along a ring.
      cursorX = round(cursorX + dx, 1);
      cursorY = round(cursorY + dy, 1);
      parts.push(`l${dx} ${dy}`);
    }

    parts.push("Z");
  }

  return parts.join("");
}

function pathsAt(weight: number) {
  const collection = feature(simplify(weighted, weight) as never, "areas" as never) as never as {
    features: {
      properties: { code: string; name: string };
      geometry: { type: string; coordinates: Position[][][] | Position[][] } | null;
    }[];
  };

  const paths = new Map<string, { name: string; d: string; points: number }>();

  for (const item of collection.features) {
    const rings = ringsOf(item.geometry as Feature["geometry"]).filter(ring => ring.length >= 4);

    if (rings.length === 0) continue;

    paths.set(item.properties.code, {
      name: item.properties.name,
      d: toPath(rings),
      points: rings.reduce((total, ring) => total + ring.length, 0),
    });
  }

  return paths;
}

const detail = pathsAt(DETAIL_WEIGHT);
const coarse = pathsAt(COARSE_WEIGHT);

// A small area can simplify away entirely at the coarse level; it must still be
// drawn and clickable, so it falls back to its detailed outline.
for (const [code, shape] of detail) if (!coarse.has(code)) coarse.set(code, shape);

const shapes = [...coarse]
  .map(([code, shape]) => ({ code, name: shape.name, d: shape.d }))
  .toSorted((a, b) => a.code.localeCompare(b.code));

const detailPaths = Object.fromEntries([...detail].map(([code, shape]) => [code, shape.d]));

const coarseFile = { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, shapes };
const outputCoarse = resolvePath(import.meta.dirname, OUTPUT_COARSE);
const outputDetail = resolvePath(import.meta.dirname, OUTPUT_DETAIL);

await writeFile(outputCoarse, JSON.stringify(coarseFile));
await writeFile(outputDetail, JSON.stringify(detailPaths));

const total = (map: Map<string, { points: number }>) =>
  [...map.values()].reduce((sum, shape) => sum + shape.points, 0);
const kb = (value: object) => (JSON.stringify(value).length / 1024).toFixed(0);

console.log(
  `coarse: ${shapes.length} areas, ${total(coarse).toLocaleString()} points, ${kb(coarseFile)} kB\n` +
    `detail: ${detail.size} areas, ${total(detail).toLocaleString()} points, ${kb(detailPaths)} kB`,
);
