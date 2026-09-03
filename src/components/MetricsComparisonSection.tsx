import { MetricCard, type MetricCardProps } from "@components/MetricCard";
import { MetricProjection } from "@components/MetricProjection";
import { YEAR } from "@data/abs";
import { type RegionDemographics, useRegionDemographics } from "@hooks/useRegionDemographics";
import type { LeverChanges } from "@model/levers";
import { hasAnyLeverChange, project, type Projection, projectSeries } from "@model/project";
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
          : `Victoria${meta.comparable ? "" : " (total)"}: ${formatValue(stateBaseline, meta.format)}`,
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
                />
              )
            }
          />
        );
      })}
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
      <section className="metrics-section">
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
    <section className="metrics-section">
      <header className="metrics-section__header">
        <h2>{location.name} vs Victoria</h2>
        <p>{YEAR} figures from the ABS regional dataset, compared against Victoria as a whole.</p>
      </header>

      {cards.every(card => card.value === undefined) && (
        <p className="metrics-section__status" role="status">
          The ABS publishes no figures for this area. Small and unusual areas are suppressed to
          protect privacy.
        </p>
      )}

      <div className="metrics-section__group">
        <h3>Demographics</h3>

        <MetricsGrid
          cards={cards}
          projections={projections}
          leverChanges={leverChanges}
          horizonYears={horizonYears}
          showProjections={showProjections}
        />
      </div>
    </section>
  );
}
