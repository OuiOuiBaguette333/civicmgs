import simulate from "@utils/simulate";
import { describe, expect, it } from "vitest";

describe("simulate", () => {
  it("leaves a figure alone when nothing has changed", () => {
    expect(simulate(16_841)).toBe(16_841);
    expect(simulate(16_841, 0)).toBe(16_841);
  });

  it("applies a percentage change in both directions", () => {
    expect(simulate(1000, 20)).toBe(1200);
    expect(simulate(1000, -20)).toBe(800);
  });

  it("keeps the precision of a rate instead of rounding it away", () => {
    expect(simulate(3.7, 10)).toBeCloseTo(4.07, 10);
  });
});
