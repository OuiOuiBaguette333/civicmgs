import metrics from "@data/abs/SA2_VIC_metrics.json";
import districts from "@data/abs/SED_VIC.json";
import type { AreaFigures, Electorate } from "@model/electorates";
import { summariseAll } from "@model/electorates";
import { describe, expect, it } from "vitest";

/**
 * The district-to-suburb join is produced offline from two 100 MB+ boundary
 * files, so nothing in the app would notice if a rebuild went wrong. These
 * check the shape of the result against facts that hold independently of it.
 */

const electorates = districts as Electorate[];
const figures = metrics as AreaFigures;

/** Victoria's Legislative Assembly has had 88 districts since 1985. */
const ASSEMBLY_DISTRICTS = 88;

/** The ABS estimated resident population of Victoria at the 2021 census. */
const VICTORIA_POPULATION = 6_547_822;

describe("the Victorian electorate join", () => {
  it("covers every Legislative Assembly district", () => {
    expect(electorates).toHaveLength(ASSEMBLY_DISTRICTS);
    expect(new Set(electorates.map(district => district.code)).size).toBe(ASSEMBLY_DISTRICTS);
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
    const unassigned = Object.keys(figures).filter(code => !assigned.has(code));

    expect(unassigned).toEqual([]);
  });

  // The strongest check available: if a suburb were dropped, duplicated or put
  // in two districts, the districts would no longer add up to the state.
  it("adds up to Victoria's population once summarised", () => {
    const total = summariseAll(electorates, figures).reduce(
      (sum, district) => sum + (district.figures.population ?? 0),
      0,
    );

    expect(total).toBe(VICTORIA_POPULATION);
  });
});
