// Turns an ABS SA2 boundary file into pre-projected SVG paths.
//
//   npm run data:shapes -- [path-to-geojson]
//
// Projecting and simplifying here rather than in the browser means the app
// ships path strings and needs no geographic libraries at all.

import { writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

import { geoMercator } from "d3-geo";

import { streamFeatures } from "./streamFeatures.ts";

type Position = [number, number];

interface Feature {
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown } | null;
}

const INPUT = process.argv[2] ?? "raw-sa2.geojson";
const OUTPUT = "../src/data/abs/SA2_VIC_shapes.json";

/** Victorian SA2 codes all begin with the state's ASGS code. */
const VICTORIA_PREFIX = "2";

const WIDTH = 800;
const HEIGHT = 560;
const PADDING = 8;

/** Pixels of detail worth keeping, at the size the map is drawn. */
const TOLERANCE = 0.35;

const CODE_KEYS = ["SA2_CODE_2021", "sa2_code_2021", "SA2_CODE21", "SA2_MAIN21"];
const NAME_KEYS = ["SA2_NAME_2021", "sa2_name_2021", "SA2_NAME21"];

const pick = (properties: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    if (!properties) return;

    const value = properties[key];

    if (typeof value === "string" && value !== "") return value;
  }
};

/** Perpendicular distance from `point` to the line through `start` and `end`. */
function distanceToLine(point: Position, start: Position, end: Position) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);

  if (length === 0) return Math.hypot(x - x1, y - y1);

  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length;
}

/** Ramer–Douglas–Peucker, run in projected space so the tolerance is in pixels. */
function simplify(points: Position[], tolerance: number): Position[] {
  if (points.length <= 2) return points;

  let worst = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = distanceToLine(points[i], points[0], points.at(-1)!);

    if (distance > worst) {
      worst = distance;
      index = i;
    }
  }

  if (worst <= tolerance) return [points[0], points.at(-1)!];

  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

const ringsOf = (geometry: Feature["geometry"]): Position[][] => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates as Position[][];
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as Position[][][]).flat();
  }

  return [];
};

const area = (ring: Position[]) => {
  let total = 0;

  for (const [index, [x, y]] of ring.entries()) {
    const [nextX, nextY] = ring[(index + 1) % ring.length];
    total += x * nextY - nextX * y;
  }

  return Math.abs(total) / 2;
};

const toPath = (rings: Position[][]) =>
  rings
    .map(ring => `M${ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`)
    .join("");

const inputPath = resolvePath(process.cwd(), INPUT);

const isVictorian = (feature: Feature) =>
  pick(feature.properties, CODE_KEYS)?.startsWith(VICTORIA_PREFIX) === true &&
  feature.geometry !== null;

// Pass one: the extent, so the projection can be fitted before anything is
// projected. Only four numbers are retained, whatever the file's size.
let minLongitude = Infinity;
let minLatitude = Infinity;
let maxLongitude = -Infinity;
let maxLatitude = -Infinity;
let found = 0;

for await (const feature of streamFeatures<Feature>(inputPath)) {
  if (!isVictorian(feature)) continue;

  found += 1;

  for (const ring of ringsOf(feature.geometry)) {
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
 * Fitted to the raw extent rather than to the features themselves. d3's
 * geoPath treats a clockwise ring as covering the rest of the planet, and
 * boundary exports do not guarantee winding order — fitting to a bounding box
 * of plain points cannot be misread that way.
 *
 * Mercator rather than a conic: across a single state the distortion is
 * imperceptible, and it stays monotonic in latitude so the fit is exact.
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

/** Area-weighted centroid of a projected ring. */
function centroidOf(rings: Position[][]): Position {
  const ring = rings.reduce((largest, candidate) =>
    area(candidate) > area(largest) ? candidate : largest,
  );

  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (const [index, [px, py]] of ring.entries()) {
    const [qx, qy] = ring[(index + 1) % ring.length];
    const cross = px * qy - qx * py;

    twiceArea += cross;
    x += (px + qx) * cross;
    y += (py + qy) * cross;
  }

  if (twiceArea === 0) return ring[0];

  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

// Pass two: project and simplify each feature as it arrives, keeping only the
// finished path string.
const shapes: { code: string; name: string; d: string; cx: number; cy: number }[] = [];

for await (const feature of streamFeatures<Feature>(inputPath)) {
  if (isVictorian(feature)) {
    const code = pick(feature.properties, CODE_KEYS)!;
    const name = pick(feature.properties, NAME_KEYS) ?? code;

    const projected = ringsOf(feature.geometry)
      .map(ring => ring.map(position => projection(position)).filter(Boolean) as Position[])
      .filter(ring => ring.length >= 4);

    const simplified = projected
      .map(ring => simplify(ring, TOLERANCE))
      // A ring simplified into a sliver is not worth drawing, but a feature
      // must never vanish entirely or its suburb becomes unclickable.
      .filter(ring => ring.length >= 4 && area(ring) > 0.5);

    const rings = simplified.length > 0 ? simplified : projected.slice(0, 1);
    const [centreX, centreY] = centroidOf(rings);

    const d = toPath(rings);

    if (d !== "") {
      shapes.push({
        code,
        name,
        d,
        cx: Number(centreX.toFixed(1)),
        cy: Number(centreY.toFixed(1)),
      });
    }
  }
}

shapes.sort((a, b) => a.code.localeCompare(b.code));

const output = { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, shapes };
const outputPath = resolvePath(import.meta.dirname, OUTPUT);

await writeFile(outputPath, JSON.stringify(output));

const points = shapes.reduce((total, shape) => total + shape.d.split("L").length, 0);

console.log(
  `${shapes.length} Victorian SA2 shapes, ~${points.toLocaleString()} points, ` +
    `${(JSON.stringify(output).length / 1024).toFixed(0)} kB -> ${outputPath}`,
);
