import { ElectionCountdown } from "@components/ElectionCountdown";
import { ElectorateDirectory } from "@components/ElectorateDirectory";
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
      <header className="home-page__header">
        <p className="home-page__eyebrow">CivicLens</p>
        <h1 tabIndex={-1}>What would a promise actually do to your suburb?</h1>

        <p className="home-page__intro">
          Victorian census figures, district by district. Choose a suburb to move a policy lever and
          see the projected effect as a range, with the research it rests on shown alongside it —
          and with the links research does not support marked as unsupported rather than filled in
          with a number.
        </p>

        <button className="home-page__open" onClick={onOpenDashboard} type="button">
          Open the map and simulator
        </button>
      </header>

      {next ? (
        <ElectionCountdown election={next} now={now} />
      ) : (
        <p className="directory__status">
          No election with a set date is coming up. Dates appear here once they are called.
        </p>
      )}

      <section className="home-page__directory">
        <h2 className="home-page__section-title">Electoral districts</h2>

        <p className="home-page__lede">
          Each district’s figures are its suburbs combined: population is a sum and rates are
          weighted by population. Suburbs are matched to the district containing their centre, so
          one straddling a boundary is counted wholly on one side.
        </p>

        <ElectorateDirectory onSelectArea={onSelectArea} />

        <p className="home-page__footnote">
          Seats show the 2022 election result: the party that won, the margin — the winner’s share
          of the final two candidates, less 50 — and the member elected then. A margin under six
          points is called marginal, up to ten fairly safe, and wider than that safe, which is the
          usual convention rather than a prediction. They are not the current chamber — by-elections
          and changes of party since have moved it to roughly Labor 54, Coalition 29 and a
          crossbench of 5. The margin is the part that keeps its meaning, because it says how
          contestable the district was when it was last tested.
        </p>

        <p className="home-page__footnote">
          † A median is not an average. The ABS publishes a median per suburb, not the incomes
          behind it, so a district’s figure here is the population-weighted mean of its suburbs’
          medians — close to the district median, but not the same number.
        </p>
      </section>
    </main>
  );
}
