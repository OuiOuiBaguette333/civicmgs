import { type AreaFigures, type Electorate, isAveragedMedian, summarise } from "@model/electorates";
import { describe, expect, it } from "vitest";

const district: Electorate = { code: "201", name: "Albert Park", areas: ["a", "b", "c"] };

const figures: AreaFigures = {
  a: { population: 1000, unemploymentRate: 2, medianEquivalisedHouseholdIncome: 1000 },
  b: { population: 3000, unemploymentRate: 6, medianEquivalisedHouseholdIncome: 2000 },
  // c has no published figures at all.
};

describe("summarise", () => {
  it("sums population across the suburbs", () => {
    expect(summarise(district, figures).figures.population).toBe(4000);
  });

  it("weights rates by population rather than treating suburbs as equal", () => {
    // A plain mean would say 4%; the larger suburb should pull it to 5%.
    expect(summarise(district, figures).figures.unemploymentRate).toBeCloseTo(5, 10);
  });

  it("reports how many suburbs it has nothing for", () => {
    expect(summarise(district, figures).withoutFigures).toBe(1);
  });

  it("ignores a suburb with a figure but no population to weight it by", () => {
    const unweighted: AreaFigures = { ...figures, d: { unemploymentRate: 99 } };
    const wider = { ...district, areas: [...district.areas, "d"] };

    expect(summarise(wider, unweighted).figures.unemploymentRate).toBeCloseTo(5, 10);
  });

  it("says nothing at all for a district with no figures", () => {
    expect(summarise({ ...district, areas: ["c"] }, figures).figures).toStrictEqual({});
  });
});

describe("isAveragedMedian", () => {
  /**
   * A weighted mean of suburb medians is not a district median, and the
   * interface has to say so wherever one is shown.
   */
  it("flags the metrics that are medians of a median", () => {
    expect(isAveragedMedian("medianEquivalisedHouseholdIncome")).toBe(true);
    expect(isAveragedMedian("medianAge")).toBe(true);
    expect(isAveragedMedian("rent")).toBe(true);
  });

  it("leaves rates and counts alone", () => {
    expect(isAveragedMedian("unemploymentRate")).toBe(false);
    expect(isAveragedMedian("year12Completion")).toBe(false);
    expect(isAveragedMedian("population")).toBe(false);
  });
});
