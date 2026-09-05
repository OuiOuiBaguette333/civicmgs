import districts from "@data/abs/SED_VIC.json";
import { type Party, SEATS_2022 } from "@data/seats2022";
import { describe, expect, it } from "vitest";

/**
 * The seat results were compiled by hand from published sources, because the
 * VEC puts district results on web pages and a map rather than in a data file.
 * These are the checks that make that defensible.
 */

/** The published Assembly result: 56 Labor, 19 Liberal, 9 National, 4 Greens. */
const PUBLISHED_TOTALS: Record<Party, number> = {
  Labor: 56,
  Liberal: 19,
  National: 9,
  Greens: 4,
};

const ASSEMBLY_DISTRICTS = 88;

describe("the 2022 Assembly results", () => {
  it("covers every district exactly once", () => {
    expect(SEATS_2022).toHaveLength(ASSEMBLY_DISTRICTS);
    expect(new Set(SEATS_2022.map(seat => seat.district)).size).toBe(ASSEMBLY_DISTRICTS);
  });

  // The strongest check on the compiled data: one row carrying the wrong party
  // would break a total, and the totals are published independently.
  it("adds up to the published party totals", () => {
    const totals: Partial<Record<Party, number>> = {};

    for (const seat of SEATS_2022) totals[seat.party] = (totals[seat.party] ?? 0) + 1;

    expect(totals).toEqual(PUBLISHED_TOTALS);
  });

  // A winner of the final two-candidate count holds more than half of it by
  // definition, so anything at or below 50 is a transcription error.
  it("has every winner above half the final count", () => {
    const impossible = SEATS_2022.filter(seat => seat.twoCandidatePreferred <= 50);

    expect(impossible).toEqual([]);
  });

  it("names the same districts as the boundary data", () => {
    expect(SEATS_2022.map(seat => seat.district).toSorted()).toEqual(
      districts.map(district => district.name).toSorted(),
    );
  });
});
