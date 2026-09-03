import { EFFECTS, isQuantified } from "@model/effects";
import { LEVERS_BY_ID } from "@model/levers";
import { DEMOGRAPHICS_META } from "@utils/demographics";
import { describe, expect, it } from "vitest";

describe("the effects table", () => {
  it("points every link at a lever and a metric that exist", () => {
    for (const effect of EFFECTS) {
      expect(LEVERS_BY_ID[effect.lever]).toBeDefined();
      expect(DEMOGRAPHICS_META[effect.outcome]).toBeDefined();
    }
  });

  it("gives every link a citation that can be followed", () => {
    for (const effect of EFFECTS) {
      expect(effect.citation.url).toMatch(/^https:\/\//u);
      expect(effect.citation.setting).toBeTruthy();
      expect(effect.derivation.length).toBeGreaterThan(40);
      expect(effect.timingNote).toBeTruthy();
    }
  });

  it("orders every band low to high and states what it is per", () => {
    for (const effect of EFFECTS.filter(candidate => isQuantified(candidate))) {
      const { low, central, high } = effect.magnitude;

      expect(low).toBeLessThanOrEqual(central);
      expect(central).toBeLessThanOrEqual(high);
      expect(effect.perLeverChange).toBeGreaterThan(0);
    }
  });

  it("makes every link wait, since no census measure moves the year a policy passes", () => {
    for (const effect of EFFECTS) {
      expect(effect.lagYears).toBeGreaterThan(0);
      expect(effect.phaseInYears).toBeGreaterThan(0);
    }
  });

  it("puts no number on a link that only has a known direction", () => {
    for (const effect of EFFECTS) {
      expect("magnitude" in effect).toBe(isQuantified(effect));
    }
  });
});
