import type { Seat } from "@data/seats2022";
import { marginOf, safenessOf } from "@model/seats";
import { describe, expect, it } from "vitest";

const seat = (twoCandidatePreferred: number): Seat => ({
  district: "Somewhere",
  member: "A Member",
  party: "Labor",
  twoCandidatePreferred,
});

describe("marginOf", () => {
  it("measures the winner's lead over an even split, not their share", () => {
    expect(marginOf(seat(60))).toBeCloseTo(10, 10);
  });

  it("is near zero for a seat decided by a handful of votes", () => {
    expect(marginOf(seat(50.2))).toBeCloseTo(0.2, 10);
  });
});

describe("safenessOf", () => {
  it("calls anything under six points marginal", () => {
    expect(safenessOf(0.2)).toBe("marginal");
    expect(safenessOf(5.9)).toBe("marginal");
  });

  it("calls six to ten, inclusive, fairly safe", () => {
    expect(safenessOf(6)).toBe("fairly safe");
    expect(safenessOf(10)).toBe("fairly safe");
  });

  it("calls anything past ten safe", () => {
    expect(safenessOf(10.1)).toBe("safe");
    expect(safenessOf(24.6)).toBe("safe");
  });

  // tcp - 50 in floating point lands on 5.899999… for a 55.9 seat, which must
  // still read as marginal.
  it("is not fooled by float noise in the margin", () => {
    expect(safenessOf(marginOf(seat(55.9)))).toBe("marginal");
    expect(safenessOf(marginOf(seat(56)))).toBe("fairly safe");
    expect(safenessOf(marginOf(seat(60)))).toBe("fairly safe");
  });
});
