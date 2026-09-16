import { ElectionCountdown } from "@components/ElectionCountdown";
import { ElectorateDirectory } from "@components/ElectorateDirectory";
import { KeyDates } from "@components/KeyDates";
import { Colophon, Masthead } from "@components/Masthead";
import { upcomingElections } from "@data/elections";
import { useToday } from "@hooks/useToday";
import type { Location } from "@types";

interface HomePageProps {
  onSelectArea: (location: Location) => void;
  onOpenDashboard: () => void;
}

export function HomePage({ onSelectArea, onOpenDashboard }: HomePageProps) {
  const now = useToday();
  const [next] = upcomingElections(now);

  return (
    <main className="home-page">
      <Masthead now={now} />

      <section className="hero">
        <div className="hero__lead">
          <h1 tabIndex={-1}>What would a promise actually do to your suburb?</h1>

          <p className="hero__intro">
            Victorian census figures, district by district. Choose a suburb to move a policy lever
            and see the projected effect as a range, with the research it rests on shown alongside
            it — and with the links research does not support marked as unsupported rather than
            filled in with a number.
          </p>

          <button className="link-button hero__open" onClick={onOpenDashboard} type="button">
            Open the map and simulator
            <svg
              className="hero__arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10h13M11 5l5 5-5 5" />
            </svg>
          </button>
        </div>

        {next ? (
          <ElectionCountdown election={next} now={now} />
        ) : (
          <p className="hero__aside">
            No election with a set date is coming up. Dates appear here once they are called.
          </p>
        )}
      </section>

      {next && <KeyDates election={next} now={now} />}

      <section className="home-page__directory" aria-labelledby="districts-title">
        <ElectorateDirectory onSelectArea={onSelectArea} />

        <Footnotes />
      </section>

      <Colophon sources="ABS Census 2021 on ASGS 2024 boundaries · VEC 2022 results" />
    </main>
  );
}

/** What the seat and income figures in the directory do and do not mean. */
function Footnotes() {
  return (
    <div className="home-page__footnotes">
      <p className="home-page__footnote">
        Seats show the 2022 election result: the party that won, the margin — the winner’s share of
        the final two candidates, less 50 — and the member elected then. A margin under six points
        is called marginal, up to ten fairly safe, and wider than that safe, which is the usual
        convention rather than a prediction. They are not the current chamber: by-elections and
        changes of party since have moved it to roughly Labor 54, Coalition 29 and a crossbench of
        5. The margin is the part that keeps its meaning, because it says how contestable the
        district was when it was last tested.
      </p>

      <p className="home-page__footnote">
        † Household income is the weekly median, equivalised for household size. A median is not an
        average: the ABS publishes a median per suburb, not the incomes behind it, so a district’s
        figure here is the population-weighted mean of its suburbs’ medians — close to the district
        median, but not the same number.
      </p>
    </div>
  );
}
