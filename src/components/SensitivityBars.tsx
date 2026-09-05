import { type Sensitivity, sensitivityDomain } from "@model/sensitivity";
import type { DemographicFormat } from "@utils/demographics";
import formatValue from "@utils/format";

interface SensitivityBarsProps {
  rows: Sensitivity[];
  central: number;
  format: DemographicFormat;
  /** Whether the projection is held at the edge of the scale. */
  pinned: boolean;
}

const BASIS_LABELS: Record<Sensitivity["basis"], string> = {
  evidence: "from the study",
  assumption: "our assumption",
  mixed: "study, with our floor",
};

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

/**
 * A bar with no width means one of two very different things: the assumption
 * has no leverage yet, or the answer is already at the edge of the scale and
 * cannot move whatever the assumption does.
 */
const flatReason = (pinned: boolean) =>
  pinned ? "held at the limit of the scale" : "no effect at this horizon";

/**
 * One bar per assumption, spanning where the answer lands when that assumption
 * alone is moved across its range. Widest first, so the parameter carrying the
 * answer is the one at the top.
 *
 * Which that is changes with the horizon: early on the lag dominates, because
 * the time elapsed since it ended is short and a year either way is a large
 * share of it; later the phase-in takes over.
 */
export function SensitivityBars({ rows, central, format, pinned }: SensitivityBarsProps) {
  if (rows.length === 0) return null;

  const domain = sensitivityDomain(rows, central);
  const span = domain.max - domain.min || 1;
  const at = (value: number) => (value - domain.min) / span;

  return (
    <div className="sensitivity">
      <p className="sensitivity__lead">
        How far the answer moves when one assumption is changed on its own, widest first.
      </p>

      {rows.map(row => (
        <div className="sensitivity__row" key={row.key}>
          <p className="sensitivity__label">
            {row.label}
            <span className={`sensitivity__basis sensitivity__basis--${row.basis}`}>
              {BASIS_LABELS[row.basis]}
            </span>
          </p>

          <div className="sensitivity__track">
            <span className="sensitivity__centre" style={{ left: percent(at(central)) }} />

            <span
              className="sensitivity__bar"
              style={{ left: percent(at(row.min)), width: percent(at(row.max) - at(row.min)) }}
            />
          </div>

          <p className="sensitivity__range">
            {row.spread === 0
              ? flatReason(pinned)
              : `${formatValue(row.min, format)} to ${formatValue(row.max, format)}`}
            <span className="sensitivity__note"> · {row.note}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
