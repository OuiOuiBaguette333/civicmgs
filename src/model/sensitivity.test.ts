import type { Effect } from "@model/effects";
import { CITATIONS } from "@model/evidence";
import { type LeverChanges, NO_LEVER_CHANGES } from "@model/levers";
import { projectOutcome } from "@model/project";
import { sensitivities, sensitivityDomain } from "@model/sensitivity";
import { describe, expect, it } from "vitest";

const SCHOOL: Effect = {
  lever: "schoolFunding",
  outcome: "year12Completion",
  strength: "moderate",
  kind: "absolute",
  perLeverChange: 10,
  magnitude: { low: 3, central: 9.5, high: 11.6 },
  lagYears: 13,
  phaseInYears: 55,
  derivation: "test",
  timingNote: "test",
  citation: CITATIONS.jacksonJohnsonPersico2016,
};

const changes = (overrides: Partial<LeverChanges>): LeverChanges => ({
  ...NO_LEVER_CHANGES,
  ...overrides,
});

const moved = changes({ schoolFunding: 20 });
const rowsAt = (horizon: number) =>
  sensitivities("year12Completion", 61.4, moved, horizon, [SCHOOL]);
const spreadOf = (horizon: number, label: string) =>
  rowsAt(horizon).find(row => row.label === label)!.spread;

describe("sensitivities", () => {
  it("reports nothing when no lever has moved", () => {
    expect(sensitivities("year12Completion", 61.4, NO_LEVER_CHANGES, 20, [SCHOOL])).toStrictEqual(
      [],
    );
  });

  it("varies each parameter of an active effect", () => {
    expect(
      rowsAt(20)
        .map(row => row.label)
        .toSorted(),
    ).toStrictEqual(["Effect size", "Lag", "Phase-in"]);
  });

  it("ranks by how far the answer moves", () => {
    const spreads = rowsAt(20).map(row => row.spread);

    expect(spreads).toStrictEqual(spreads.toSorted((a, b) => b - a));
  });

  it("reproduces the projected band when varying the effect size", () => {
    // Moving the central estimate to each end of the study's range should land
    // exactly on the band the projection already shows.
    const { projected } = projectOutcome("year12Completion", 61.4, moved, 20, [SCHOOL]);
    const size = rowsAt(20).find(row => row.label === "Effect size")!;

    expect(size.min).toBeCloseTo(projected.low, 10);
    expect(size.max).toBeCloseTo(projected.high, 10);
  });

  it("labels the study's range as evidence and the timings as assumptions", () => {
    const byLabel = Object.fromEntries(rowsAt(20).map(row => [row.label, row.basis]));

    expect(byLabel).toStrictEqual({
      "Effect size": "evidence",
      Lag: "assumption",
      "Phase-in": "assumption",
    });
  });

  /**
   * Asked about a horizon that falls before the lag ends, a shorter lag is the
   * only change that can bring the effect into range at all — so it is the only
   * assumption with any leverage, and the study's own range has none.
   */
  it("before the lag ends, only the lag can move the answer", () => {
    const spreads = Object.fromEntries(rowsAt(10).map(row => [row.label, row.spread]));

    expect(spreads.Lag).toBeGreaterThan(0);
    expect(spreads["Effect size"]).toBe(0);
    expect(spreads["Phase-in"]).toBe(0);
  });

  /**
   * The finding this view exists to show: which timing assumption carries the
   * answer is not fixed, it depends on the horizon being asked about.
   */
  it("gives the lag more leverage early and the phase-in more leverage late", () => {
    expect(spreadOf(20, "Lag")).toBeGreaterThan(spreadOf(20, "Phase-in"));
    expect(spreadOf(50, "Phase-in")).toBeGreaterThan(spreadOf(50, "Lag"));
  });

  it("stops mattering once the effect has reached everyone", () => {
    // Fully phased in, a quarter either way on the timings changes nothing.
    expect(spreadOf(200, "Lag")).toBe(0);
    expect(spreadOf(200, "Phase-in")).toBe(0);
  });
});

describe("sensitivityDomain", () => {
  it("spans every row and the central estimate", () => {
    const rows = rowsAt(30);
    const { central } = projectOutcome("year12Completion", 61.4, moved, 30, [SCHOOL]).projected;
    const domain = sensitivityDomain(rows, central);

    expect(domain.min).toBeLessThanOrEqual(Math.min(...rows.map(row => row.min)));
    expect(domain.max).toBeGreaterThanOrEqual(Math.max(...rows.map(row => row.max)));
    expect(domain.min).toBeLessThanOrEqual(central);
    expect(domain.max).toBeGreaterThanOrEqual(central);
  });
});
