import { NumberBox } from "@components/NumberBox";
import type { ReactNode } from "react";

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

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          id={sliderId}
          onChange={event => onChange(event.target.valueAsNumber)}
        />

        <NumberBox
          id={`box-${id}`}
          label={`${label} change, percent`}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
        />

        <span aria-hidden="true">%</span>
      </div>

      {children}

      {warning && <p className="slider-row__warning">{warning}</p>}
    </fieldset>
  );
}
