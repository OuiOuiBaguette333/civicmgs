import {
  daysUntil,
  type Election,
  formatMilestoneDate,
  formatMilestoneTime,
  melbourneDay,
  type Milestone,
  nextActionableMilestone,
} from "@data/elections";

const plural = (days: number) => (Math.abs(days) === 1 ? "day" : "days");

export const countLabel = (days: number) => (days === 0 ? "today" : `${days} ${plural(days)}`);

const byTime = (a: Milestone, b: Milestone) => Date.parse(a.at) - Date.parse(b.at);

/**
 * Two milestones on one day would otherwise carry the same date and look like
 * a duplicate, so those show their hour as well: "3 Nov · 6 pm".
 */
function dateLabel(milestone: Milestone, milestones: Milestone[]) {
  const day = melbourneDay(new Date(milestone.at));
  const shared = milestones.some(
    other => other !== milestone && melbourneDay(new Date(other.at)) === day,
  );

  return shared
    ? `${formatMilestoneDate(milestone.at)} · ${formatMilestoneTime(milestone.at)}`
    : formatMilestoneDate(milestone.at);
}

function MilestoneList({ election, now }: { election: Election; now: Date }) {
  // The same milestone the callout names, so the two never point apart.
  const upcoming = nextActionableMilestone(election, now);
  const milestones = election.milestones.toSorted(byTime);

  return (
    <ol className="milestones" role="list">
      {milestones.map(milestone => {
        const passed = Date.parse(milestone.at) <= now.getTime();
        const isNext = milestone === upcoming;

        return (
          <li
            className={`milestones__item${passed ? " milestones__item--past" : ""}${
              isNext ? " milestones__item--next" : ""
            }`}
            key={`${milestone.at}-${milestone.label}`}
          >
            <span className="milestones__dot" aria-hidden="true" />
            <span className="milestones__date caps">{dateLabel(milestone, milestones)}</span>

            <span className="milestones__label">
              {milestone.label}
              {milestone.detail && <span className="milestones__detail">{milestone.detail}</span>}
            </span>

            <span className="milestones__when">
              {passed ? "done" : countLabel(daysUntil(milestone.at, now))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The election's key dates as a rail across the page, under a section head. */
export function KeyDates({ election, now }: { election: Election; now: Date }) {
  return (
    <section className="key-dates" aria-labelledby="key-dates-title">
      <div className="rule-head">
        <h2 id="key-dates-title">Key dates</h2>
        <p className="caps">Counted in Melbourne calendar days</p>
      </div>

      <MilestoneList election={election} now={now} />
    </section>
  );
}
