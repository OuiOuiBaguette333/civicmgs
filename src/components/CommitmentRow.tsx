import { NumberBox } from "@components/NumberBox";
import {
  BILLION,
  COMMITMENT_YEARS,
  commitmentFromPercent,
  percentFromCommitment,
} from "@model/cost";
import { LEVER_MAX, LEVER_MIN, LEVERS_BY_ID, type LeverId } from "@model/levers";
import { clamp } from "@utils";

interface CommitmentRowProps {
  lever: LeverId;
  percent: number;
  years: number;
  onPercentChange: (percent: number) => void;
  onYearsChange: (years: number) => void;
}

const toBillions = (dollars: number) => Number((dollars / BILLION).toFixed(2));

/**
 * Spending is announced as a total over a forward-estimates period, not as a
 * sustained percentage. This lets a promise be typed the way it was made.
 */
export function CommitmentRow({
  lever,
  percent,
  years,
  onPercentChange,
  onYearsChange,
}: CommitmentRowProps) {
  const { label, costBasis } = LEVERS_BY_ID[lever];

  if (!costBasis) return null;

  const limit = toBillions(commitmentFromPercent(LEVER_MAX, years, costBasis));

  const handleDollars = (billions: number) => {
    const asPercent = Number(
      percentFromCommitment(billions * BILLION, years, costBasis).toFixed(3),
    );
    onPercentChange(clamp(asPercent, LEVER_MIN, LEVER_MAX));
  };

  return (
    <div className="commitment">
      <span className="commitment__lead">or</span>
      <span aria-hidden="true">$</span>

      <NumberBox
        id={`cost-${lever}`}
        label={`${label}, billions of dollars committed`}
        value={toBillions(commitmentFromPercent(percent, years, costBasis))}
        min={-limit}
        max={limit}
        step={0.01}
        onChange={handleDollars}
      />

      <span>billion over</span>

      <label className="visually-hidden" htmlFor={`over-${lever}`}>
        Years the commitment is spread over
      </label>

      <select
        id={`over-${lever}`}
        value={years}
        onChange={event => onYearsChange(Number(event.target.value))}
      >
        {COMMITMENT_YEARS.map(option => (
          <option key={option} value={option}>
            {option} {option === 1 ? "year" : "years"}
          </option>
        ))}
      </select>
    </div>
  );
}
