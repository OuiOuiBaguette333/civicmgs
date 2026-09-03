import { clamp } from "@utils";
import { useState, type ChangeEvent, type FocusEvent } from "react";

interface SimulatorPanelProps<T extends Record<string, number>> {
  simulatedChanges: T;
  onSimulationChange: (value: T) => void;
  onReset: () => void;
  labels: Record<keyof T, string>;
}

interface SliderRowProps {
  metric: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const MIN = -20;
const MAX = 20;
const STEP = 0.1;

const roundToStep = (value: number) => Math.round(value * 10) / 10;

function SliderRow({ metric, label, value, onChange }: SliderRowProps) {
  /**
   * Only set while the box is being typed in. Falling back to the prop the rest
   * of the time means an outside change — a reset — flows through on its own,
   * while a half-typed "1." survives the parent echoing back 1.
   */
  const [draft, setDraft] = useState<string | null>(null);

  const sliderId = `slider-${metric}`;
  const boxId = `box-${metric}`;

  const handleBoxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);

    // An empty box means the user is partway through retyping, not asking for 0.
    if (text.trim() === "") return;

    const parsed = Number(text);

    if (Number.isFinite(parsed) && parsed >= MIN && parsed <= MAX) onChange(parsed);
  };

  const handleBoxBlur = (event: FocusEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    setDraft(null);
    onChange(Number.isFinite(parsed) ? roundToStep(clamp(parsed, MIN, MAX)) : 0);
  };

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(null);
    onChange(event.target.valueAsNumber);
  };

  return (
    <fieldset className="scenario-slider-row">
      <legend className="scenario-slider-row__legend">{label}</legend>

      <div className="scenario-slider-row__controls">
        <label className="visually-hidden" htmlFor={sliderId}>
          {label} change, slider
        </label>

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={value}
          id={sliderId}
          onChange={handleSliderChange}
        />

        <label className="visually-hidden" htmlFor={boxId}>
          {label} change, percent
        </label>

        <input
          type="number"
          min={MIN}
          max={MAX}
          step={STEP}
          value={draft ?? value}
          id={boxId}
          onChange={handleBoxChange}
          onBlur={handleBoxBlur}
        />

        <span aria-hidden="true">%</span>
      </div>
    </fieldset>
  );
}

export function SimulatorPanel<T extends Record<string, number>>({
  simulatedChanges,
  onSimulationChange,
  onReset,
  labels,
}: SimulatorPanelProps<T>) {
  const handleChange = (metric: string, newValue: number) => {
    onSimulationChange({
      ...simulatedChanges,
      [metric]: Number.isNaN(newValue) ? 0 : newValue,
    });
  };

  const isModified = Object.values(simulatedChanges).some(value => value !== 0);

  return (
    <section className="scenario-panel">
      <div className="scenario-panel__header">
        <div>
          <h2>Scenario simulator</h2>
          <p>Adjust a percentage to see it applied to the figures below.</p>
        </div>

        {isModified && (
          <button type="button" onClick={onReset}>
            Reset
          </button>
        )}
      </div>

      {Object.entries(simulatedChanges).map(([metric, value]) => (
        <SliderRow
          key={metric}
          metric={metric}
          label={labels[metric]}
          value={value}
          onChange={newValue => handleChange(metric, newValue)}
        />
      ))}
    </section>
  );
}
