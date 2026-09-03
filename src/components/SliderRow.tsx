import { clamp } from "@utils";
import { useState, type ChangeEvent, type FocusEvent, type ReactNode } from "react";

interface NumberBoxProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export interface SliderRowProps extends Omit<NumberBoxProps, "id"> {
  /** Used to build the control ids, so it must be free of spaces. */
  id: string;
  description?: ReactNode;
  /** Shown under the row when the value has left what the evidence covers. */
  warning?: ReactNode;
}

function NumberBox({ id, label, value, min, max, step, onChange }: NumberBoxProps) {
  /**
   * Held only while the box is being typed in. Falling back to the prop the
   * rest of the time means an outside change — a reset — flows through on its
   * own, while a half-typed entry survives the parent echoing a value back.
   */
  const [draft, setDraft] = useState<string | null>(null);

  const round = (input: number) => Number((Math.round(input / step) * step).toFixed(4));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);

    // An empty box means the user is partway through retyping, not asking for 0.
    if (text.trim() === "") return;

    const parsed = Number(text);

    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    setDraft(null);
    onChange(Number.isFinite(parsed) ? round(clamp(parsed, min, max)) : 0);
  };

  return (
    <>
      <label className="visually-hidden" htmlFor={id}>
        {label} change, percent
      </label>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft ?? value}
        id={id}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </>
  );
}

export function SliderRow({ id, description, warning, ...control }: SliderRowProps) {
  const { label, value, min, max, step, onChange } = control;
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

        <NumberBox {...control} id={`box-${id}`} />

        <span aria-hidden="true">%</span>
      </div>

      {warning && <p className="slider-row__warning">{warning}</p>}
    </fieldset>
  );
}
