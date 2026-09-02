import type { Delta } from "@utils/format";

export interface MetricCardProps {
  label: string;
  /** Absent where the ABS suppresses the measure for this area. */
  value?: string;
  note?: string;
  /** The unsimulated figure, shown only while a slider is moving this metric. */
  baseline?: string;
  stateValue?: string;
  delta?: Delta;
  /** Whether changes to the value should be announced to screen readers. */
  live?: boolean;
}

export function MetricCard({
  label,
  value,
  note,
  baseline,
  stateValue,
  delta,
  live = false,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-card__label">{label}</p>

      <p
        className={`metric-card__value${value === undefined ? " metric-card__value--empty" : ""}`}
        aria-live={live ? "polite" : undefined}
      >
        {value ?? "Not available"}
      </p>

      {note && <p className="metric-card__note">{note}</p>}

      {baseline && <p className="metric-card__baseline">Baseline: {baseline}</p>}

      {stateValue && <p className="metric-card__average">{stateValue}</p>}

      {delta && (
        <p className={`metric-card__delta metric-card__delta--${delta.tone}`}>{delta.label}</p>
      )}
    </article>
  );
}
