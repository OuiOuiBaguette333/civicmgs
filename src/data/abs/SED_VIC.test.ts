import metrics from "@data/abs/SA2_VIC_metrics.json";
import districts from "@data/abs/SED_VIC.json";
import type { AreaFigures, Electorate } from "@model/electorates";
import { summariseAll } from "@model/electorates";
import { describe, expect, it } from "vitest";

/**
 * The district-to-suburb join is produced offline from two large boundary
 * files, so nothing in the app would notice if a rebuild went wrong. These
 * check the result against facts that hold independently of it.
 *
 * The count test used to be the whole of this file, and it was not enough:
 * Victoria's 2020-21 redivision abolished nine districts and created nine, so
 * a boundary file from the wrong side of it still had exactly 88 districts and
 * passed. The set of names below is the fix — it comes from the districts
 * actually contested at the 2022 election, which is a different source
 * entirely from the boundaries.
 */

const electorates = districts as Electorate[];
const figures = metrics as AreaFigures;

/** Every district contested at the 2022 state election, and so also in 2026. */
const CONTESTED_2022 = [
  "Albert Park", "Ashwood", "Bass", "Bayswater", "Bellarine", "Benambra",
  "Bendigo East", "Bendigo West", "Bentleigh", "Berwick", "Box Hill", "Brighton",
  "Broadmeadows", "Brunswick", "Bulleen", "Bundoora", "Carrum", "Caulfield",
  "Clarinda", "Cranbourne", "Croydon", "Dandenong", "Eildon", "Eltham",
  "Essendon", "Eureka", "Euroa", "Evelyn", "Footscray", "Frankston", "Geelong",
  "Gippsland East", "Gippsland South", "Glen Waverley", "Greenvale", "Hastings",
  "Hawthorn", "Ivanhoe", "Kalkallo", "Kew", "Kororoit", "Lara", "Laverton",
  "Lowan", "Macedon", "Malvern", "Melbourne", "Melton", "Mildura", "Mill Park",
  "Monbulk", "Mordialloc", "Mornington", "Morwell", "Mulgrave", "Murray Plains",
  "Narracan", "Narre Warren North", "Narre Warren South", "Nepean", "Niddrie",
  "Northcote", "Oakleigh", "Ovens Valley", "Pakenham", "Pascoe Vale",
  "Point Cook", "Polwarth", "Prahran", "Preston", "Richmond", "Ringwood",
  "Ripon", "Rowville", "Sandringham", "Shepparton", "South Barwon",
  "South-West Coast", "St Albans", "Sunbury", "Sydenham", "Tarneit",
  "Thomastown", "Warrandyte", "Wendouree", "Werribee", "Williamstown",
  "Yan Yean",
];

/** Eight Legislative Council regions, each built from eleven districts. */
const COUNCIL_REGIONS = 8;
const DISTRICTS_PER_REGION = 11;

/** The ABS estimated resident population of Victoria at the 2021 census. */
const VICTORIA_POPULATION = 6_547_822;

describe("the Victorian electorate join", () => {
  it("is the districts being contested, not a superseded set of the same size", () => {
    expect([...electorates.map(district => district.name)].toSorted()).toEqual(
      [...CONTESTED_2022].toSorted(),
    );
  });

  it("splits into eight Legislative Council regions of eleven", () => {
    const perRegion = new Map<string | undefined, number>();

    for (const district of electorates) {
      perRegion.set(district.region, (perRegion.get(district.region) ?? 0) + 1);
    }

    expect(perRegion.size).toBe(COUNCIL_REGIONS);
    expect([...perRegion.values()]).toEqual(
      Array.from({ length: COUNCIL_REGIONS }, () => DISTRICTS_PER_REGION),
    );
  });

  it("gives every district at least one suburb", () => {
    expect(electorates.filter(district => district.areas.length === 0)).toEqual([]);
  });

  it("puts each suburb in exactly one district", () => {
    const assigned = electorates.flatMap(district => district.areas);

    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it("accounts for every suburb the census publishes figures for", () => {
    const assigned = new Set(electorates.flatMap(district => district.areas));

    expect(Object.keys(figures).filter(code => !assigned.has(code))).toEqual([]);
  });

  // If a suburb were dropped, duplicated or put in two districts, the districts
  // would no longer add up to the state.
  it("adds up to Victoria's population once summarised", () => {
    const total = summariseAll(electorates, figures).reduce(
      (sum, district) => sum + (district.figures.population ?? 0),
      0,
    );

    expect(total).toBe(VICTORIA_POPULATION);
  });
});
