import type { Delta } from "@utils/format";
import type { ReactNode } from "react";

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
  /** The modelled projection, when a policy scenario is running. */
  footer?: ReactNode;
}

export function MetricCard({
  label,
  value,
  note,
  baseline,
  stateValue,
  delta,
  live = false,
  footer,
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

      {(stateValue || delta) && (
        <div className="metric-card__compare">
          {stateValue && <span className="metric-card__average">{stateValue}</span>}

          {delta && (
            <span className={`metric-card__delta metric-card__delta--${delta.tone}`}>
              {delta.label}
            </span>
          )}
        </div>
      )}

      {footer}
    </article>
  );
}
