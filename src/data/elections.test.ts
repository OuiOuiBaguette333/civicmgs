import { daysUntil, ELECTIONS, nextMilestone, phaseOf, upcomingElections } from "@data/elections";
import { describe, expect, it } from "vitest";

const vic = ELECTIONS[0];
const at = (iso: string) => new Date(iso);

describe("daysUntil", () => {
  it("counts whole calendar days in Melbourne", () => {
    expect(daysUntil(vic.at, at("2026-11-27T00:00:00+11:00"))).toBe(1);
    expect(daysUntil(vic.at, at("2026-09-05T00:00:00+10:00"))).toBe(84);
  });

  it("counts the day itself as zero however late in the day it is", () => {
    expect(daysUntil(vic.at, at("2026-11-28T00:01:00+11:00"))).toBe(0);
    expect(daysUntil(vic.at, at("2026-11-28T23:59:00+11:00"))).toBe(0);
  });

  it("goes negative once it has passed", () => {
    expect(daysUntil(vic.at, at("2026-11-29T09:00:00+11:00"))).toBe(-1);
  });

  /** A reader in London should be told the same number of days as one in Kew. */
  it("gives the same answer whatever timezone the reader is in", () => {
    const melbourneMorning = at("2026-11-20T09:00:00+11:00");
    const sameInstantInLondon = at("2026-11-19T22:00:00+00:00");

    expect(daysUntil(vic.at, melbourneMorning)).toBe(daysUntil(vic.at, sameInstantInLondon));
  });
});

describe("phaseOf", () => {
  it("moves from upcoming to today to past", () => {
    expect(phaseOf(vic, at("2026-11-27T12:00:00+11:00"))).toBe("upcoming");
    expect(phaseOf(vic, at("2026-11-28T12:00:00+11:00"))).toBe("today");
    expect(phaseOf(vic, at("2026-11-29T12:00:00+11:00"))).toBe("past");
  });
});

describe("nextMilestone", () => {
  it("picks the soonest one still ahead", () => {
    expect(nextMilestone(vic, at("2026-09-05T00:00:00+10:00"))?.label).toBe("Writs issued");
    expect(nextMilestone(vic, at("2026-11-04T00:00:00+11:00"))?.label).toBe("Nominations close");
  });

  it("has nothing left once the election is over", () => {
    expect(nextMilestone(vic, at("2026-12-01T00:00:00+11:00"))).toBeUndefined();
  });
});

describe("upcomingElections", () => {
  it("keeps an election through its own day and drops it after", () => {
    expect(upcomingElections(at("2026-11-28T12:00:00+11:00"))).toHaveLength(1);
    expect(upcomingElections(at("2026-11-29T12:00:00+11:00"))).toHaveLength(0);
  });

  it("only carries elections with a date actually set", () => {
    // A guessed federal or council date would be worse than none.
    expect(ELECTIONS.every(election => Number.isFinite(Date.parse(election.at)))).toBe(true);
    expect(ELECTIONS.every(election => election.source.url.startsWith("https://"))).toBe(true);
  });
});
