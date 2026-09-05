/**
 * Only elections with a date actually set appear here. The next federal
 * election and the next Victorian council elections are both governed by terms
 * rather than a fixed announced day, so they are deliberately absent: a
 * countdown to a guess would be worse than no countdown.
 */

export interface Milestone {
  /** An instant, with the offset spelled out so a reader elsewhere sees the
   *  same countdown as a reader in Melbourne. */
  at: string;
  label: string;
  detail?: string;
  /** A deadline the reader can still do something about. */
  actionable?: boolean;
}

export interface Election {
  id: string;
  name: string;
  body: string;
  /** When polls open on election day. */
  at: string;
  source: { title: string; url: string };
  milestones: Milestone[];
}

export const ELECTIONS: Election[] = [
  {
    id: "vic-2026",
    name: "Victorian state election",
    body: "88 Legislative Assembly districts and 8 Legislative Council regions",
    at: "2026-11-28T08:00:00+11:00",
    source: {
      title: "Victorian Electoral Commission — 2026 state election",
      url: "https://www.vec.vic.gov.au/voting/2026-state-election",
    },
    milestones: [
      {
        at: "2026-11-03T20:00:00+11:00",
        label: "Enrolment closes",
        detail: "The last moment to enrol or update your address for this election.",
        actionable: true,
      },
      { at: "2026-11-03T18:00:00+11:00", label: "Writs issued" },
      { at: "2026-11-09T12:00:00+11:00", label: "Nominations close" },
      { at: "2026-11-18T09:00:00+11:00", label: "Early voting opens", actionable: true },
      {
        at: "2026-11-25T18:00:00+11:00",
        label: "Postal vote applications close",
        actionable: true,
      },
      { at: "2026-11-27T18:00:00+11:00", label: "Early voting closes" },
      {
        at: "2026-11-28T08:00:00+11:00",
        label: "Election day",
        detail: "Voting is open from 8 am to 6 pm.",
      },
    ],
  },
];

const MELBOURNE = "Australia/Melbourne";

const dayFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The calendar day an instant falls on in Melbourne, as a day number. Counting
 * calendar days rather than 24-hour periods is what makes "3 days away" mean
 * what a reader expects, and doing it in the election's own timezone keeps the
 * answer the same for someone reading from overseas.
 */
export function melbourneDay(instant: Date) {
  const parts = dayFormat.formatToParts(instant);
  const part = (type: string) => Number(parts.find(entry => entry.type === type)?.value);

  return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000;
}

const longFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE,
  day: "numeric",
  month: "short",
});

/** Spelled out, in Melbourne's timezone: "Saturday 28 November 2026". */
export const formatElectionDate = (at: string) => longFormat.format(new Date(at));

/** Compact, for a list of dates that share a year: "28 Nov". */
export const formatMilestoneDate = (at: string) => shortFormat.format(new Date(at));

/** Whole calendar days from `now` until `target`; negative once it has passed. */
export const daysUntil = (target: string, now: Date) =>
  melbourneDay(new Date(target)) - melbourneDay(now);

export type ElectionPhase = "upcoming" | "today" | "past";

export function phaseOf(election: Election, now: Date): ElectionPhase {
  const days = daysUntil(election.at, now);

  if (days > 0) return "upcoming";

  return days === 0 ? "today" : "past";
}

/** The next milestone still ahead, which is the one worth acting on. */
export function nextMilestone(election: Election, now: Date) {
  return election.milestones
    .toSorted((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .find(milestone => Date.parse(milestone.at) > now.getTime());
}

/**
 * The next deadline worth putting in front of a reader. "Writs issued" is ahead
 * of "enrolment closes" by two hours and is nothing anyone can act on, so the
 * soonest milestone is not always the one to lead with.
 */
export function nextActionableMilestone(election: Election, now: Date) {
  const ahead = election.milestones
    .toSorted((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .filter(milestone => Date.parse(milestone.at) > now.getTime());

  return ahead.find(milestone => milestone.actionable) ?? ahead[0];
}

/** Elections still to come, soonest first. */
export const upcomingElections = (now: Date, elections: Election[] = ELECTIONS) =>
  elections
    .filter(election => phaseOf(election, now) !== "past")
    .toSorted((a, b) => Date.parse(a.at) - Date.parse(b.at));
