import type { Effect } from "@model/effects";
import { CITATIONS } from "@model/evidence";
import { type LeverChanges, NO_LEVER_CHANGES } from "@model/levers";
import { exposure, project, projectOutcome } from "@model/project";
import { describe, expect, it } from "vitest";

const timing = {
  lagYears: 10,
  phaseInYears: 20,
  timingNote: "test",
  derivation: "test",
  citation: CITATIONS.jacksonJohnsonPersico2016,
};

const POINTS: Effect = {
  ...timing,
  lever: "schoolFunding",
  outcome: "year12Completion",
  strength: "moderate",
  kind: "absolute",
  perLeverChange: 10,
  magnitude: { low: 2, central: 10, high: 12 },
};

const PERCENT_OF_VALUE: Effect = {
  ...timing,
  lever: "schoolFunding",
  outcome: "medianEquivalisedHouseholdIncome",
  strength: "strong",
  kind: "relative",
  perLeverChange: 10,
  magnitude: { low: 1, central: 5, high: 8 },
};

const SECOND_LEVER: Effect = {
  ...timing,
  lever: "employmentServices",
  outcome: "year12Completion",
  strength: "moderate",
  kind: "absolute",
  perLeverChange: 10,
  magnitude: { low: 1, central: 1, high: 1 },
};

const DIRECTION_ONLY: Effect = {
  ...timing,
  lever: "housingSupply",
  outcome: "year12Completion",
  strength: "direction-only",
  direction: "up",
};

const changes = (overrides: Partial<LeverChanges>): LeverChanges => ({
  ...NO_LEVER_CHANGES,
  ...overrides,
});

describe("exposure", () => {
  it("is nothing until the lag has passed", () => {
    expect(exposure(0, 10, 20)).toBe(0);
    expect(exposure(10, 10, 20)).toBe(0);
  });

  it("ramps in over the phase-in period", () => {
    expect(exposure(15, 10, 20)).toBeCloseTo(0.25, 10);
    expect(exposure(20, 10, 20)).toBeCloseTo(0.5, 10);
  });

  it("never exceeds the whole population", () => {
    expect(exposure(30, 10, 20)).toBe(1);
    expect(exposure(500, 10, 20)).toBe(1);
  });
});

describe("projectOutcome", () => {
  it("leaves the metric alone when no lever has moved", () => {
    const result = projectOutcome("year12Completion", 61.4, NO_LEVER_CHANGES, 20, [POINTS]);

    expect(result.projected).toStrictEqual({ low: 61.4, central: 61.4, high: 61.4 });
    expect(result.unchanged).toBe(true);
    expect(result.contributions).toHaveLength(0);
  });

  it("leaves the metric alone until the lag has passed, however big the lever", () => {
    const result = projectOutcome("year12Completion", 61.4, changes({ schoolFunding: 50 }), 5, [
      POINTS,
    ]);

    expect(result.projected.central).toBe(61.4);
    expect(result.unchanged).toBe(false);
  });

  it("scales percentage-point effects by the lever and the exposed share", () => {
    // 20% lever against a 10% study change = 2x; exposure at year 20 = 0.5.
    const result = projectOutcome("year12Completion", 61.4, changes({ schoolFunding: 20 }), 20, [
      POINTS,
    ]);

    expect(result.projected.central).toBeCloseTo(61.4 + 10 * 2 * 0.5, 10);
    expect(result.projected.low).toBeCloseTo(61.4 + 2 * 2 * 0.5, 10);
    expect(result.projected.high).toBeCloseTo(61.4 + 12 * 2 * 0.5, 10);
  });

  it("scales relative effects against the metric's own value", () => {
    const result = projectOutcome(
      "medianEquivalisedHouseholdIncome",
      1000,
      changes({ schoolFunding: 10 }),
      30,
      [PERCENT_OF_VALUE],
    );

    expect(result.projected.central).toBeCloseTo(1050, 10);
  });

  it("keeps the band the right way round when the lever is cut", () => {
    const result = projectOutcome("year12Completion", 61.4, changes({ schoolFunding: -20 }), 20, [
      POINTS,
    ]);

    expect(result.projected.low).toBeLessThan(result.projected.high);
    expect(result.projected.central).toBeCloseTo(61.4 - 10, 10);
    expect(result.projected.low).toBeCloseTo(61.4 - 12, 10);
  });
});

describe("projectOutcome, at the edges", () => {
  it("adds the levers rather than compounding them", () => {
    const result = projectOutcome(
      "year12Completion",
      60,
      changes({ schoolFunding: 10, employmentServices: 10 }),
      30,
      [POINTS, SECOND_LEVER],
    );

    expect(result.contributions).toHaveLength(2);
    expect(result.projected.central).toBeCloseTo(60 + 10 + 1, 10);
  });

  it("holds a percentage inside 0 to 100 however hard the lever is pushed", () => {
    const result = projectOutcome("year12Completion", 95, changes({ schoolFunding: 50 }), 50, [
      POINTS,
    ]);

    expect(result.projected.high).toBe(100);
    expect(result.projected.central).toBeLessThanOrEqual(100);
  });

  it("never lets a metric go negative", () => {
    const result = projectOutcome(
      "medianEquivalisedHouseholdIncome",
      1000,
      changes({ schoolFunding: -50 }),
      50,
      [PERCENT_OF_VALUE],
    );

    expect(result.projected.low).toBeGreaterThanOrEqual(0);
  });

  it("reports a direction-only link without letting it move the number", () => {
    const result = projectOutcome("year12Completion", 61.4, changes({ housingSupply: 20 }), 50, [
      DIRECTION_ONLY,
    ]);

    expect(result.projected.central).toBe(61.4);
    expect(result.contributions).toHaveLength(0);
    expect(result.unquantified).toHaveLength(1);
    expect(result.unchanged).toBe(false);
  });
});

describe("project", () => {
  it("covers only the metrics the ABS actually returned", () => {
    const projections = project(
      { year12Completion: 61.4, rent: 370 },
      changes({ schoolFunding: 10 }),
      30,
      [POINTS],
    );

    expect(Object.keys(projections).toSorted()).toStrictEqual(["rent", "year12Completion"]);
    expect(projections.rent?.unchanged).toBe(true);
    expect(projections.year12Completion?.unchanged).toBe(false);
  });
});
