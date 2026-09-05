import { type Sensitivity, sensitivityDomain } from "@model/sensitivity";
import type { DemographicFormat } from "@utils/demographics";
import formatValue from "@utils/format";

interface SensitivityBarsProps {
  rows: Sensitivity[];
  central: number;
  format: DemographicFormat;
}

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

/**
 * One bar per assumption, spanning where the answer lands when that assumption
 * alone is moved across its range. Widest first, so the parameter carrying the
 * answer is the one at the top.
 *
 * Which that is changes with the horizon: early on the lag dominates, because
 * the time elapsed since it ended is short and a year either way is a large
 * share of it; later the phase-in takes over.
 */
export function SensitivityBars({ rows, central, format }: SensitivityBarsProps) {
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
              {row.basis === "evidence" ? "from the study" : "our assumption"}
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
              ? "no effect at this horizon"
              : `${formatValue(row.min, format)} to ${formatValue(row.max, format)}`}
            <span className="sensitivity__note"> · {row.note}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
