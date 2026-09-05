import {
  daysUntil,
  type Election,
  formatElectionDate,
  formatMilestoneDate,
  nextActionableMilestone,
} from "@data/elections";

const plural = (days: number) => (Math.abs(days) === 1 ? "day" : "days");

const countLabel = (days: number) => (days === 0 ? "today" : `${days} ${plural(days)}`);

function CountdownFigure({ days }: { days: number }) {
  if (days < 0) return <p className="countdown__called">This election has been held.</p>;

  if (days === 0) {
    return (
      <p className="countdown__called countdown__called--today">
        Polls are open today, 8 am to 6 pm.
      </p>
    );
  }

  return (
    <p className="countdown__figure">
      <span className="countdown__days">{days}</span>
      <span className="countdown__unit">{plural(days)} to go</span>
    </p>
  );
}

function MilestoneList({ election, now }: { election: Election; now: Date }) {
  // The same milestone the callout names, so the two never point apart.
  const upcoming = nextActionableMilestone(election, now);

  return (
    <ol className="milestones">
      {election.milestones
        .toSorted((a, b) => Date.parse(a.at) - Date.parse(b.at))
        .map(milestone => {
          const passed = Date.parse(milestone.at) <= now.getTime();
          const isNext = milestone === upcoming;

          return (
            <li
              className={`milestones__item${passed ? " milestones__item--past" : ""}${
                isNext ? " milestones__item--next" : ""
              }`}
              key={`${milestone.at}-${milestone.label}`}
            >
              <span className="milestones__date">{formatMilestoneDate(milestone.at)}</span>

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

interface ElectionCountdownProps {
  election: Election;
  now: Date;
}

export function ElectionCountdown({ election, now }: ElectionCountdownProps) {
  const days = daysUntil(election.at, now);
  const upcoming = nextActionableMilestone(election, now);

  return (
    <section className="countdown">
      <div className="countdown__lead">
        <p className="countdown__eyebrow">Next election</p>
        <h2 className="countdown__name">{election.name}</h2>
        <p className="countdown__date">{formatElectionDate(election.at)}</p>

        <CountdownFigure days={days} />

        <p className="countdown__body">{election.body}</p>

        {upcoming && (
          <p className="countdown__next">
            <strong>{upcoming.label}</strong> in {countLabel(daysUntil(upcoming.at, now))}.
            {upcoming.detail && ` ${upcoming.detail}`}
          </p>
        )}

        <p className="countdown__source">
          <a href={election.source.url} target="_blank" rel="noreferrer">
            {election.source.title}
          </a>
        </p>
      </div>

      <div className="countdown__timeline">
        <h3 className="countdown__timeline-title">Key dates</h3>
        <MilestoneList election={election} now={now} />
      </div>
    </section>
  );
}
