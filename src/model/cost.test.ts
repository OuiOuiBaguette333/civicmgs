import {
  BILLION,
  commitmentFromPercent,
  DEFAULT_COMMITMENT_YEARS,
  percentFromCommitment,
} from "@model/cost";
import { LEVERS_BY_ID } from "@model/levers";
import { describe, expect, it } from "vitest";

const basis = { annualSpend: 10 * BILLION, derivation: "test", sources: [] };

describe("percentFromCommitment", () => {
  it("spreads a promise evenly across its forward-estimates period", () => {
    // $2bn over 4 years is $500m a year against a $10bn base: 5%.
    expect(percentFromCommitment(2 * BILLION, 4, basis)).toBeCloseTo(5, 10);
  });

  it("halves when the same money is spread over twice as long", () => {
    expect(percentFromCommitment(2 * BILLION, 8, basis)).toBeCloseTo(2.5, 10);
  });

  it("carries the sign of a cut", () => {
    expect(percentFromCommitment(-2 * BILLION, 4, basis)).toBeCloseTo(-5, 10);
  });

  it("refuses to divide by nothing", () => {
    expect(percentFromCommitment(BILLION, 0, basis)).toBe(0);
    expect(percentFromCommitment(BILLION, 4, { ...basis, annualSpend: 0 })).toBe(0);
    expect(percentFromCommitment(Number.NaN, 4, basis)).toBe(0);
  });
});

describe("commitmentFromPercent", () => {
  it("inverts the conversion", () => {
    for (const percent of [-20, -0.5, 0, 3.7, 20]) {
      const dollars = commitmentFromPercent(percent, 4, basis);
      expect(percentFromCommitment(dollars, 4, basis)).toBeCloseTo(percent, 10);
    }
  });

  it("costs more the longer the promise runs", () => {
    expect(commitmentFromPercent(5, 4, basis)).toBeCloseTo(2 * BILLION, 4);
    expect(commitmentFromPercent(5, 8, basis)).toBeCloseTo(4 * BILLION, 4);
  });
});

describe("the school funding basis", () => {
  const schoolBasis = LEVERS_BY_ID.schoolFunding.costBasis;

  it("prices the lever against Victorian government schools", () => {
    expect(schoolBasis).toBeDefined();
    expect(schoolBasis!.annualSpend).toBeCloseTo(661_326.7 * 21_550, 0);
    expect(schoolBasis!.sources.length).toBeGreaterThan(0);
  });

  it("turns a plausible announcement into a plausible percentage", () => {
    // A $2.4bn, four-year promise is a few percent, not a transformation.
    const percent = percentFromCommitment(2.4 * BILLION, DEFAULT_COMMITMENT_YEARS, schoolBasis!);

    expect(percent).toBeGreaterThan(4);
    expect(percent).toBeLessThan(4.5);
  });
});
