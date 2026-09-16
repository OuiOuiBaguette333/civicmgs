import { MetricCard, type MetricCardProps } from "@components/MetricCard";
import { MetricProjection } from "@components/MetricProjection";
import { YEAR } from "@data/abs";
import { type RegionDemographics, useRegionDemographics } from "@hooks/useRegionDemographics";
import { effectsForLever } from "@model/effects";
import { type LeverChanges, LEVERS, LEVERS_BY_ID } from "@model/levers";
import { hasAnyLeverChange, project, type Projection, projectSeries } from "@model/project";
import { sensitivities } from "@model/sensitivity";
import type { Location } from "@types";
import {
  DEMOGRAPHICS,
  DEMOGRAPHICS_META,
  type Demographic,
  isChangeable,
  type PartialDemographics,
  type SimulatedChanges,
} from "@utils/demographics";
import formatValue, { createDelta } from "@utils/format";
import simulate from "@utils/simulate";

interface MetricsComparisonSectionProps {
  location?: Location;
  simulatedChanges: SimulatedChanges;
  leverChanges: LeverChanges;
  horizonYears: number;
}

type MetricCardWithKey = MetricCardProps & { metric: Demographic };

function buildCards(
  area: PartialDemographics,
  victoria: PartialDemographics,
  simulatedChanges: SimulatedChanges,
): MetricCardWithKey[] {
  return DEMOGRAPHICS.map(metric => {
    const meta = DEMOGRAPHICS_META[metric];
    const changeable = isChangeable(metric);
    const change = changeable ? simulatedChanges[metric] : 0;

    const baseline = area[metric];
    const value = baseline === undefined ? undefined : simulate(baseline, change);
    const stateBaseline = victoria[metric];

    return {
      metric,
      label: meta.label,
      note: meta.note,
      live: changeable,
      value: value === undefined ? undefined : formatValue(value, meta.format),
      baseline:
        change !== 0 && baseline !== undefined ? formatValue(baseline, meta.format) : undefined,
      stateValue:
        stateBaseline === undefined
          ? undefined
          : `Victoria${meta.comparable ? "" : " (total)"} ${formatValue(stateBaseline, meta.format)}`,
      // A suburb count against a state total is not a comparison, so metrics
      // marked incomparable get the context line without a difference.
      delta:
        meta.comparable && value !== undefined && stateBaseline !== undefined
          ? createDelta(value, stateBaseline, meta)
          : undefined,
    };
  });
}

interface MetricsGridProps {
  cards: MetricCardWithKey[];
  projections: Partial<Record<Demographic, Projection>>;
  leverChanges: LeverChanges;
  horizonYears: number;
  showProjections: boolean;
}

/** Levers the model cannot project, named so their stillness is explained. */
const UNLINKED_LEVERS = LEVERS.filter(lever => effectsForLever(lever).length === 0).map(
  lever => LEVERS_BY_ID[lever].label,
);

const listed = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/**
 * The ninth cell of the grid. Eight figures in three columns leave a gap, and
 * the gap is where the reading of the ranges belongs.
 */
function RangesNote({
  showProjections,
  horizonYears,
}: Pick<MetricsGridProps, "showProjections" | "horizonYears">) {
  return (
    <div className="metric-card metric-card--note">
      <p className="caps">{showProjections ? "About these ranges" : "Projections"}</p>

      <p className="metric-card__prose">
        {showProjections ? (
          <>
            Ranges are the low and high estimates of the studies behind each link, applied to this
            suburb’s own figures with the lag and phase-in the model assumes; nothing arrives before
            the first cohort exposed to the change has been counted.
            {UNLINKED_LEVERS.length > 0 &&
              ` ${listed(UNLINKED_LEVERS)} ${UNLINKED_LEVERS.length === 1 ? "moves" : "move"} nothing because no study links ${UNLINKED_LEVERS.length === 1 ? "it" : "them"} to a figure shown here.`}
          </>
        ) : (
          <>
            Move a policy lever and each figure it touches gains a projection {horizonYears} years
            ahead: a range, the studies it rests on, and what would move the answer.
          </>
        )}
      </p>
    </div>
  );
}

function MetricsGrid({
  cards,
  projections,
  leverChanges,
  horizonYears,
  showProjections,
}: MetricsGridProps) {
  return (
    <div className="metrics-grid">
      {cards.map(({ metric, ...card }) => {
        const projection = projections[metric];

        return (
          <MetricCard
            key={metric}
            {...card}
            footer={
              showProjections &&
              projection && (
                <MetricProjection
                  projection={projection}
                  horizonYears={horizonYears}
                  label={card.label}
                  series={projectSeries(metric, projection.baseline, leverChanges, horizonYears)}
                  sensitivity={sensitivities(
                    metric,
                    projection.baseline,
                    leverChanges,
                    horizonYears,
                  )}
                />
              )
            }
          />
        );
      })}

      <RangesNote showProjections={showProjections} horizonYears={horizonYears} />
    </div>
  );
}

function statusMessage(state: RegionDemographics) {
  switch (state.status) {
    case "error":
      return state.message;
    case "loading":
      return "Loading figures from the ABS…";
    default:
      return "Select a suburb to see its figures.";
  }
}

export function MetricsComparisonSection({
  location,
  simulatedChanges,
  leverChanges,
  horizonYears,
}: MetricsComparisonSectionProps) {
  const { state, retry } = useRegionDemographics(location);

  if (!location || state.status !== "ready") {
    return (
      <section className="metrics-section" aria-labelledby="metrics-title">
        <div className="rule-head">
          <h2 id="metrics-title">{location ? `${location.name} against Victoria` : "Figures"}</h2>
          <p className="caps">{YEAR} census · ABS regional dataset</p>
        </div>

        <p className="metrics-section__status" role="status">
          {statusMessage(state)}
        </p>

        {state.status === "error" && (
          <p>
            <button type="button" onClick={retry}>
              Try again
            </button>
          </p>
        )}
      </section>
    );
  }

  const cards = buildCards(state.area, state.victoria, simulatedChanges);

  // Projections run off the ABS baseline, not the directly adjusted figure, so
  // the two panels cannot be mistaken for one compounding scenario.
  const projections = project(state.area, leverChanges, horizonYears);
  const showProjections = hasAnyLeverChange(leverChanges);

  return (
    <section className="metrics-section" aria-labelledby="metrics-title">
      <div className="rule-head">
        <h2 id="metrics-title">{location.name} against Victoria</h2>
        <p className="caps">{YEAR} census · ABS regional dataset</p>
      </div>

      {cards.every(card => card.value === undefined) ? (
        <p className="metrics-section__status" role="status">
          The ABS publishes no figures for this area. Small and unusual areas are suppressed to
          protect privacy.
        </p>
      ) : (
        <MetricsGrid
          cards={cards}
          projections={projections}
          leverChanges={leverChanges}
          horizonYears={horizonYears}
          showProjections={showProjections}
        />
      )}
    </section>
  );
}
