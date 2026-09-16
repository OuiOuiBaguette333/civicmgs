import { countLabel } from "@components/KeyDates";
import {
  daysUntil,
  type Election,
  formatElectionDate,
  nextActionableMilestone,
} from "@data/elections";
import { useCountUp } from "@hooks/useCountUp";

const plural = (days: number) => (Math.abs(days) === 1 ? "day" : "days");

/** As a sentence: "today", not "in today". */
const whenLabel = (days: number) => (days === 0 ? "today" : `in ${countLabel(days)}`);

function todayLine(election: Election, now: Date) {
  if (now.getTime() >= Date.parse(election.pollsClose)) return "Polls have closed.";
  if (now.getTime() >= Date.parse(election.at)) return "Polls are open now, until 6 pm.";

  return "Election day. Polls open at 8 am.";
}

function CountdownFigure({ election, now }: { election: Election; now: Date }) {
  const days = daysUntil(election.at, now);

  if (days < 0) return <p className="countdown__called">This election has been held.</p>;

  if (days === 0) {
    return <p className="countdown__called countdown__called--today">{todayLine(election, now)}</p>;
  }

  return <DaysToGo days={days} />;
}

function DaysToGo({ days }: { days: number }) {
  const shown = useCountUp(days);

  return (
    <p className="countdown__figure">
      {/* The counting is decoration; assistive tech hears the settled number once. */}
      <span className="countdown__days" aria-hidden="true">
        {shown}
      </span>
      <span className="visually-hidden">{days}</span>
      <span className="countdown__unit">{plural(days)} to go</span>
    </p>
  );
}

interface ElectionCountdownProps {
  election: Election;
  now: Date;
}

/**
 * The count to the next election, with the next deadline a reader can still
 * act on. The full list of dates is the KeyDates rail, further down the page.
 */
export function ElectionCountdown({ election, now }: ElectionCountdownProps) {
  const upcoming = nextActionableMilestone(election, now);

  return (
    <section className="countdown" aria-labelledby="countdown-title">
      <p className="caps">Next election</p>
      <h2 className="countdown__name" id="countdown-title">
        {election.name}
      </h2>
      <p className="countdown__date">{formatElectionDate(election.at)}</p>

      <CountdownFigure election={election} now={now} />

      <p className="countdown__body">{election.body}</p>

      {upcoming && (
        <p className="countdown__next">
          <strong>{upcoming.label}</strong> {whenLabel(daysUntil(upcoming.at, now))}.
          {upcoming.detail && ` ${upcoming.detail}`}
        </p>
      )}

      <p className="countdown__source">
        <a href={election.source.url} target="_blank" rel="noreferrer">
          {election.source.title}
        </a>
      </p>
    </section>
  );
}
