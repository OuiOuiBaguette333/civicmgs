import { SliderRow } from "@components/SliderRow";
import { effectsForLever } from "@model/effects";
import {
  LEVER_MAX,
  LEVER_MIN,
  LEVER_STEP,
  LEVERS,
  LEVERS_BY_ID,
  type LeverChanges,
  type LeverId,
  WELL_EVIDENCED_CHANGE,
} from "@model/levers";
import { HORIZONS } from "@model/project";

interface PolicyScenarioPanelProps {
  leverChanges: LeverChanges;
  onLeverChange: (changes: LeverChanges) => void;
  horizonYears: number;
  onHorizonChange: (years: number) => void;
  onReset: () => void;
}

function leverDescription(lever: LeverId) {
  const { description, scaleNote } = LEVERS_BY_ID[lever];
  const linked = effectsForLever(lever).length;

  if (linked === 0) {
    return `${description} No study links this to any figure shown here, so it moves nothing.`;
  }

  return scaleNote ? `${description} ${scaleNote}` : description;
}

export function PolicyScenarioPanel({
  leverChanges,
  onLeverChange,
  horizonYears,
  onHorizonChange,
  onReset,
}: PolicyScenarioPanelProps) {
  const isModified = Object.values(leverChanges).some(change => change !== 0);

  return (
    <section className="scenario-panel">
      <div className="scenario-panel__header">
        <div>
          <h2>Policy scenario</h2>
          <p>
            A sustained change in spending, projected onto the figures below using published
            research. Every number is a range, and every range shows its working.
          </p>
        </div>

        {isModified && (
          <button type="button" onClick={onReset}>
            Reset
          </button>
        )}
      </div>

      <div className="scenario-panel__horizon">
        <label htmlFor="horizon">Project</label>

        <select
          id="horizon"
          value={horizonYears}
          onChange={event => onHorizonChange(Number(event.target.value))}
        >
          {HORIZONS.map(years => (
            <option key={years} value={years}>
              {years} years ahead
            </option>
          ))}
        </select>
      </div>

      {LEVERS.map(lever => (
        <SliderRow
          key={lever}
          id={lever}
          label={LEVERS_BY_ID[lever].label}
          description={leverDescription(lever)}
          value={leverChanges[lever]}
          min={LEVER_MIN}
          max={LEVER_MAX}
          step={LEVER_STEP}
          onChange={change => onLeverChange({ ...leverChanges, [lever]: change })}
          warning={
            Math.abs(leverChanges[lever]) > WELL_EVIDENCED_CHANGE
              ? `Past ${WELL_EVIDENCED_CHANGE}% the model is extrapolating in a straight line well beyond the changes any study observed.`
              : undefined
          }
        />
      ))}
    </section>
  );
}
