import { SliderRow } from "@components/SliderRow";

interface SimulatorPanelProps<T extends Record<string, number>> {
  simulatedChanges: T;
  onSimulationChange: (value: T) => void;
  onReset: () => void;
  labels: Record<keyof T, string>;
}

const MIN = -20;
const MAX = 20;
const STEP = 0.1;

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
    <details className="scenario-panel">
      <summary className="scenario-panel__summary">
        <h2>Direct adjustment</h2>
        {isModified && <span className="scenario-panel__flag">active</span>}
      </summary>

      <div className="scenario-panel__header">
        <p>
          Scales a figure by itself, with no claim about cause. It does not feed the projection.
        </p>

        {isModified && (
          <button type="button" onClick={onReset}>
            Reset
          </button>
        )}
      </div>

      {Object.entries(simulatedChanges).map(([metric, value]) => (
        <SliderRow
          key={metric}
          id={metric}
          label={labels[metric]}
          value={value}
          min={MIN}
          max={MAX}
          step={STEP}
          onChange={newValue => handleChange(metric, newValue)}
        />
      ))}
    </details>
  );
}
