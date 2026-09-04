import { binOf, quantileBreaks } from "@utils/bins";
import { describe, expect, it } from "vitest";

describe("quantileBreaks", () => {
  it("splits a run of values into evenly filled bins", () => {
    const values = Array.from({ length: 60 }, (_, index) => index);
    const breaks = quantileBreaks(values, 6);

    expect(breaks).toHaveLength(5);
    expect(breaks[0]).toBeCloseTo(9.83, 1);
    expect(breaks.toSorted((a, b) => a - b)).toStrictEqual(breaks);
  });

  it("copes with an empty or single-valued set", () => {
    expect(quantileBreaks([], 6)).toStrictEqual([]);
    expect(quantileBreaks([5], 6)).toStrictEqual([5, 5, 5, 5, 5]);
  });

  it("ignores values that are not numbers", () => {
    expect(quantileBreaks([1, Number.NaN, 3, Number.POSITIVE_INFINITY], 2)).toStrictEqual([2]);
  });
});

describe("binOf", () => {
  const breaks = [10, 20, 30];

  it("places a value in the bin its magnitude earns", () => {
    expect(binOf(0, breaks)).toBe(0);
    expect(binOf(9.99, breaks)).toBe(0);
    expect(binOf(10, breaks)).toBe(1);
    expect(binOf(25, breaks)).toBe(2);
    expect(binOf(1000, breaks)).toBe(3);
  });

  it("puts everything in one bin when there are no breaks", () => {
    expect(binOf(42, [])).toBe(0);
  });
});
