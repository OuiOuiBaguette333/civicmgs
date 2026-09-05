import {
  daysUntil,
  ELECTIONS,
  nextActionableMilestone,
  nextMilestone,
  phaseOf,
  upcomingElections,
} from "@data/elections";
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

  /**
   * A reader in London should be told the same number of days as one in Kew.
   * 22:00 UTC on the 19th is already the 20th in Melbourne, so an
   * implementation counting UTC days would say 9 here; only one counting
   * Melbourne days says 8. (The test process runs in UTC, pinned in the vitest
   * config, so that the two really do differ.)
   */
  it("counts the day it is in Melbourne, not the day it is in UTC", () => {
    const lateEveningUtc = at("2026-11-19T22:00:00Z");

    expect(daysUntil(vic.at, lateEveningUtc)).toBe(8);
    expect(daysUntil(vic.at, at("2026-11-19T12:00:00Z"))).toBe(9);
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

describe("nextActionableMilestone", () => {
  it("skips a milestone nobody can act on in favour of one they can", () => {
    // Writs are issued at 6 pm on 3 November; enrolment closes at 8 pm the same
    // day. Chronologically the writs are next, but the reader needs the deadline.
    const before = at("2026-11-01T09:00:00+11:00");

    expect(nextMilestone(vic, before)?.label).toBe("Writs issued");
    expect(nextActionableMilestone(vic, before)?.label).toBe("Enrolment closes");
  });

  it("moves on the instant a deadline passes, not at midnight", () => {
    const justBefore = at("2026-11-03T19:59:00+11:00");
    const justAfter = at("2026-11-03T20:01:00+11:00");

    expect(nextActionableMilestone(vic, justBefore)?.label).toBe("Enrolment closes");
    expect(nextActionableMilestone(vic, justAfter)?.label).toBe("Early voting opens");
  });

  it("falls back to whatever is next once nothing actionable remains", () => {
    const afterPostals = at("2026-11-26T09:00:00+11:00");

    expect(nextActionableMilestone(vic, afterPostals)?.label).toBe("Early voting closes");
  });

  it("has nothing to say once the election is over", () => {
    expect(nextActionableMilestone(vic, at("2026-11-29T09:00:00+11:00"))).toBeUndefined();
  });
});
