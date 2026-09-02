import {
  CHANGEABLE_DEMOGRAPHICS,
  DEMOGRAPHICS,
  DEMOGRAPHICS_META,
  isChangeable,
  NO_SIMULATED_CHANGES,
} from "@utils/demographics";
import { describe, expect, it } from "vitest";

describe("demographics", () => {
  it("describes every metric it lists", () => {
    for (const metric of DEMOGRAPHICS) {
      expect(DEMOGRAPHICS_META[metric]?.label).toBeTruthy();
    }
  });

  it("starts every changeable metric at no change", () => {
    expect(Object.keys(NO_SIMULATED_CHANGES).toSorted()).toStrictEqual(
      CHANGEABLE_DEMOGRAPHICS.toSorted(),
    );
    expect(Object.values(NO_SIMULATED_CHANGES).every(change => change === 0)).toBe(true);
  });

  it("only treats listed metrics as changeable", () => {
    expect(isChangeable("population")).toBe(true);
    expect(isChangeable("unemploymentRate")).toBe(false);
  });

  it("does not offer a state comparison for counts", () => {
    // A suburb's population against Victoria's total is not a comparison.
    expect(DEMOGRAPHICS_META.population.comparable).toBe(false);
    expect(DEMOGRAPHICS_META.bornOverseasShare.comparable).toBe(true);
  });
});
