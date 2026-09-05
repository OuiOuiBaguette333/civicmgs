// Works out which suburbs sit in which Victorian state electoral district.
//
//   npm run data:electorates -- [SED.geojson] [SA2.geojson]
//
// The ABS publishes census figures for statistical areas, not for electorates,
// so the two have to be joined geographically. Each SA2 is assigned to the
// district containing its centroid.
//
// That is an approximation, and the interface says so: an SA2 straddling a
// boundary goes wholly to one side. Doing it properly means intersecting
// polygons and apportioning by population within the overlap, which the ABS
// data cannot support anyway — the figures only exist at whole-SA2 level.

import { writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

import { streamFeatures } from "./streamFeatures.ts";

type Position = [number, number];
type Ring = Position[];

interface Feature {
  properties?: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown } | null;
}

const SED_INPUT = process.argv[2] ?? "SED.geojson";
const SA2_INPUT = process.argv[3] ?? "SA2.geojson";
const OUTPUT = "../src/data/abs/SED_VIC.json";
const VICTORIA_PREFIX = "2";

const SED_CODE_KEYS = ["SED_CODE_2021", "sed_code_2021", "SED_CODE21"];
const SED_NAME_KEYS = ["SED_NAME_2021", "sed_name_2021", "SED_NAME21"];
const SA2_CODE_KEYS = ["SA2_CODE_2021", "sa2_code_2021", "SA2_CODE21", "SA2_MAIN21"];

// The ABS names every Victorian district for the Legislative Council region it
// sits in: "Albert Park (Southern Metropolitan)". Kept as two fields, so the
// card can lead with the district and the region can group 88 of them.
const NAME_WITH_REGION = /^(?<district>.+?)\s*\((?<region>[^()]+)\)$/u;

function splitName(full: string) {
  const groups = NAME_WITH_REGION.exec(full)?.groups;

  return groups ? { name: groups.district, region: groups.region } : { name: full };
}

const pick = (properties: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    if (!properties) return;

    const value = properties[key];

    if (typeof value === "string" && value !== "") return value;
  }
};

/** Polygons kept whole, so the first ring stays the outline and the rest holes. */
function polygonsOf(geometry: Feature["geometry"]): Ring[][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates as Ring[]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates as Ring[][];

  return [];
}

function boundsOf(polygons: Ring[][]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rings of polygons) {
    for (const [x, y] of rings[0]) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Ray casting: an odd number of crossings to the right means inside. */
function inRing([x, y]: Position, ring: Ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }

  return inside;
}

const inPolygons = (point: Position, polygons: Ring[][]) =>
  polygons.some(
    rings => inRing(point, rings[0]) && !rings.slice(1).some(hole => inRing(point, hole)),
  );

/** Twice the signed area of a ring, unsigned — enough to pick the largest. */
function ringArea(ring: Ring) {
  let total = 0;

  for (const [index, [x, y]] of ring.entries()) {
    const [nx, ny] = ring[(index + 1) % ring.length];
    total += x * ny - nx * y;
  }

  return Math.abs(total) / 2;
}

/** Area-weighted centroid of the largest ring — a point inside, near the middle. */
function centroidOf(polygons: Ring[][]): Position {
  const ring = polygons
    .map(rings => rings[0])
    .reduce((a, b) => (ringArea(a) > ringArea(b) ? a : b));

  let twice = 0;
  let x = 0;
  let y = 0;

  for (const [index, [px, py]] of ring.entries()) {
    const [qx, qy] = ring[(index + 1) % ring.length];
    const cross = px * qy - qx * py;

    twice += cross;
    x += (px + qx) * cross;
    y += (py + qy) * cross;
  }

  return twice === 0 ? ring[0] : [x / (3 * twice), y / (3 * twice)];
}

const sedPath = resolvePath(process.cwd(), SED_INPUT);
const sa2Path = resolvePath(process.cwd(), SA2_INPUT);

const districts: {
  code: string;
  name: string;
  region?: string;
  polygons: Ring[][];
  bounds: ReturnType<typeof boundsOf>;
  centroid: Position;
  areas: string[];
}[] = [];

for await (const item of streamFeatures<Feature>(sedPath)) {
  const code = pick(item.properties, SED_CODE_KEYS);

  if (!code?.startsWith(VICTORIA_PREFIX) || !item.geometry) continue;

  const polygons = polygonsOf(item.geometry).filter(rings => rings[0]?.length >= 4);

  if (polygons.length === 0) continue;

  districts.push({
    ...splitName(pick(item.properties, SED_NAME_KEYS) ?? code),
    code,
    polygons,
    bounds: boundsOf(polygons),
    centroid: centroidOf(polygons),
    areas: [],
  });
}

if (districts.length === 0) throw new Error(`No Victorian districts found in ${sedPath}.`);

let placed = 0;
let byNearest = 0;

for await (const item of streamFeatures<Feature>(sa2Path)) {
  const code = pick(item.properties, SA2_CODE_KEYS);

  if (!code?.startsWith(VICTORIA_PREFIX) || !item.geometry) continue;

  const polygons = polygonsOf(item.geometry).filter(rings => rings[0]?.length >= 4);

  if (polygons.length === 0) continue;

  const point = centroidOf(polygons);
  const inside = districts.find(
    district =>
      point[0] >= district.bounds.minX &&
      point[0] <= district.bounds.maxX &&
      point[1] >= district.bounds.minY &&
      point[1] <= district.bounds.maxY &&
      inPolygons(point, district.polygons),
  );

  // A concave area can put its own centroid outside itself; falling back to the
  // nearest district keeps every suburb attached to exactly one.
  const district =
    inside ??
    districts.reduce((best, candidate) =>
      Math.hypot(candidate.centroid[0] - point[0], candidate.centroid[1] - point[1]) <
      Math.hypot(best.centroid[0] - point[0], best.centroid[1] - point[1])
        ? candidate
        : best,
    );

  if (!inside) byNearest += 1;

  district.areas.push(code);
  placed += 1;
}

const output = districts
  .map(({ code, name, region, areas }) => ({ code, name, region, areas: areas.toSorted() }))
  .toSorted((a, b) => a.name.localeCompare(b.name));

const outputPath = resolvePath(import.meta.dirname, OUTPUT);
await writeFile(outputPath, JSON.stringify(output));

const empty = output.filter(district => district.areas.length === 0);

const regions = new Set(output.map(district => district.region));

console.log(
  `${output.length} Victorian districts across ${regions.size} regions, ${placed} suburbs placed ` +
    `(${byNearest} by nearest district rather than containment), ` +
    `${empty.length} districts with no suburb, ` +
    `${(JSON.stringify(output).length / 1024).toFixed(0)} kB -> ${outputPath}`,
);
