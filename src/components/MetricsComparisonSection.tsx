import { MetricCard, type MetricCardProps } from "@components/MetricCard";
import { YEAR } from "@data/abs";
import { type RegionDemographics, useRegionDemographics } from "@hooks/useRegionDemographics";
import type { Location } from "@types";
import {
  DEMOGRAPHICS,
  DEMOGRAPHICS_META,
  isChangeable,
  type PartialDemographics,
  type SimulatedChanges,
} from "@utils/demographics";
import formatValue, { createDelta } from "@utils/format";
import simulate from "@utils/simulate";

interface MetricsComparisonSectionProps {
  location?: Location;
  simulatedChanges: SimulatedChanges;
}

type MetricCardWithKey = MetricCardProps & { metric: string };

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

        <div className="metrics-grid">
          {cards.map(({ metric, ...card }) => (
            <MetricCard key={metric} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
