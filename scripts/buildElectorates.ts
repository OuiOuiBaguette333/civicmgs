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

import {
  boundsOf,
  centroidOf,
  type Geometry,
  inPolygons,
  polygonsOf,
  type Position,
  type Ring,
} from "./geometry.ts";
import { streamFeatures } from "./streamFeatures.ts";

interface Feature {
  properties?: Record<string, unknown>;
  geometry: Geometry | null;
}

const SED_INPUT = process.argv[2] ?? "SED.geojson";
const SA2_INPUT = process.argv[3] ?? "SA2.geojson";
const OUTPUT = "../src/data/abs/SED_VIC.json";
const VICTORIA_PREFIX = "2";

const SED_CODE_KEYS = [
  "sed_code_2024",
  "SED_CODE_2024",
  "SED_CODE_2021",
  "sed_code_2021",
  "SED_CODE21",
];
const SED_NAME_KEYS = [
  "sed_name_2024",
  "SED_NAME_2024",
  "SED_NAME_2021",
  "sed_name_2021",
  "SED_NAME21",
];
const SA2_CODE_KEYS = ["SA2_CODE_2021", "sa2_code_2021", "SA2_CODE21", "SA2_MAIN21"];

/*
 * The ABS gives every state two non-places: people with no usual address on
 * census night, and those offshore or in transit. Neither has an electorate.
 * They are recognisable because a real district carries its Legislative
 * Council region in brackets and these carry the state abbreviation.
 */
const NON_DISTRICTS = new Set(["No usual address", "Migratory - Offshore - Shipping"]);

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

/*
 * Victoria's 2020-21 redivision abolished nine districts and created nine, so a
 * boundary file from the wrong side of it still has exactly 88 districts and
 * still passes a count check. These are the nine created then: if none of them
 * is present, the file predates the redivision and describes the electorates
 * of the 2014 and 2018 elections, not the ones being contested in 2026.
 *
 * The ABS ASGS 2021 release is on the wrong side of this line. Its State
 * Electoral Divisions were published in July 2021 and the redivision was
 * gazetted that October.
 */
const CREATED_IN_2021_REDIVISION = [
  "Ashwood",
  "Berwick",
  "Eureka",
  "Glen Waverley",
  "Greenvale",
  "Kalkallo",
  "Laverton",
  "Pakenham",
  "Point Cook",
];

function assertCurrentBoundaries(names: string[]) {
  const found = new Set(names);
  const missing = CREATED_IN_2021_REDIVISION.filter(name => !found.has(name));

  if (missing.length < CREATED_IN_2021_REDIVISION.length) return;

  throw new Error(
    `These boundaries predate Victoria's 2020-21 redivision: none of ` +
      `${CREATED_IN_2021_REDIVISION.join(", ")} is present, and every one of them ` +
      `has been a district since the 2022 election. The count is still 88 because ` +
      `the redivision abolished nine districts and created nine. Download a State ` +
      `Electoral Division boundary file published after October 2021 — the ABS ` +
      `reissues them annually — and run this again.`,
  );
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

  const named = splitName(pick(item.properties, SED_NAME_KEYS) ?? code);

  if (NON_DISTRICTS.has(named.name)) continue;

  const polygons = polygonsOf(item.geometry).filter(rings => rings[0]?.length >= 4);

  if (polygons.length === 0) continue;

  districts.push({
    ...named,
    code,
    polygons,
    bounds: boundsOf(polygons),
    centroid: centroidOf(polygons),
    areas: [],
  });
}

if (districts.length === 0) throw new Error(`No Victorian districts found in ${sedPath}.`);

assertCurrentBoundaries(districts.map(district => district.name));

/*
 * Victoria's Legislative Council has eight regions and each is built from
 * exactly eleven Assembly districts. This does not catch a wrong vintage — the
 * pre-redivision map was 8 x 11 too, which is what assertCurrentBoundaries is
 * for — but it does catch a file that has lost its region names, mixes two
 * vintages, or has quietly dropped a district.
 */
const REGIONS = 8;
const DISTRICTS_PER_REGION = 11;

const perRegion = new Map<string, number>();

for (const district of districts) {
  const region = district.region ?? "(none)";

  perRegion.set(region, (perRegion.get(region) ?? 0) + 1);
}

const wrong = [...perRegion].filter(([, count]) => count !== DISTRICTS_PER_REGION);

if (perRegion.size !== REGIONS || wrong.length > 0) {
  throw new Error(
    `Expected ${REGIONS} Legislative Council regions of ${DISTRICTS_PER_REGION} districts each, got ` +
      `${perRegion.size} regions: ${[...perRegion].map(([r, c]) => `${r} (${c})`).join(", ")}.`,
  );
}

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
