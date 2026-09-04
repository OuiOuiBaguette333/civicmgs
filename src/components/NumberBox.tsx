import { clamp } from "@utils";
import { useState, type ChangeEvent, type FocusEvent } from "react";

export interface NumberBoxProps {
  id: string;
  /** The complete accessible name. It is not shown. */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function NumberBox({ id, label, value, min, max, step, onChange }: NumberBoxProps) {
  /**
   * Held only while the box is being typed in. Falling back to the prop the
   * rest of the time means an outside change — a reset, or a slider being
   * dragged — flows through on its own, while a half-typed entry survives the
   * parent echoing a value back.
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
        {label}
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
