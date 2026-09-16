import { NumberBox } from "@components/NumberBox";
import type { CSSProperties, ReactNode } from "react";

/** Where a value sits along the track, as a percentage for the CSS fill. */
const along = (value: number, min: number, max: number) =>
  `${((value - min) / (max - min)) * 100}%`;

export interface SliderRowProps {
  /** Used to build the control ids, so it must be free of spaces. */
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description?: ReactNode;
  /** Shown under the row when the value has left what the evidence covers. */
  warning?: ReactNode;
  /** An alternative way to set the same value, such as a dollar commitment. */
  children?: ReactNode;
}

export function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
  warning,
  children,
}: SliderRowProps) {
  const sliderId = `slider-${id}`;

  return (
    <fieldset className="slider-row">
      <legend className="slider-row__legend">{label}</legend>

      {description && <p className="slider-row__description">{description}</p>}

      <div className="slider-row__controls">
        <label className="visually-hidden" htmlFor={sliderId}>
          {label} change, slider
        </label>

        {/* The track fills from zero to the thumb, so the stylesheet needs both
            positions; a thumb resting on zero is drawn hollow. */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          id={sliderId}
          className={value === 0 ? "at-zero" : undefined}
          style={{ "--zero": along(0, min, max), "--pos": along(value, min, max) } as CSSProperties}
          aria-valuetext={`${value}%`}
          onChange={event => onChange(event.target.valueAsNumber)}
        />

        <span className="slider-row__value">
          <NumberBox
            id={`box-${id}`}
            label={`${label} change, percent`}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
          />

          <span className="slider-row__unit" aria-hidden="true">
            %
          </span>
        </span>
      </div>

      {children}

      <p className="slider-row__warning" role="status">
        {warning}
      </p>
    </fieldset>
  );
}
