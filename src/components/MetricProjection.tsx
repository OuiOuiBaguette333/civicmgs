import { ProjectionChart } from "@components/ProjectionChart";
import { SensitivityBars } from "@components/SensitivityBars";
import type { DirectionalEffect } from "@model/effects";
import {
  type Citation,
  EVIDENCE_LABELS,
  EVIDENCE_NOTES,
  type EvidenceStrength,
} from "@model/evidence";
import { LEVERS_BY_ID } from "@model/levers";
import type { Contribution, Projection, SeriesPoint } from "@model/project";
import type { Sensitivity } from "@model/sensitivity";
import { DEMOGRAPHICS_META } from "@utils/demographics";
import formatValue from "@utils/format";

interface MetricProjectionProps {
  projection: Projection;
  horizonYears: number;
  label: string;
  series: SeriesPoint[];
  sensitivity: Sensitivity[];
}

function overallStrength({ contributions, unquantified }: Projection): EvidenceStrength {
  if (contributions.length === 0) return unquantified.length > 0 ? "direction-only" : "none";

  return contributions.every(({ effect }) => effect.strength === "strong") ? "strong" : "moderate";
}

function CitationLink({ citation }: { citation: Citation }) {
  return (
    <>
      <a href={citation.url} target="_blank" rel="noreferrer">
        {citation.authors} ({citation.year}). {citation.title}
      </a>
      . {citation.publication}. {citation.setting}.
    </>
  );
}

function ContributionDetail({
  contribution,
  targetYear,
}: {
  contribution: Contribution;
  targetYear: number;
}) {
  const { effect, leverChange, exposure } = contribution;
  const { format } = DEMOGRAPHICS_META[effect.outcome];
  const signed = leverChange > 0 ? `+${leverChange}` : leverChange;

  return (
    <li className="projection__source">
      <p className="projection__source-head">
        {LEVERS_BY_ID[effect.lever].label} {signed}% ·{" "}
        {formatValue(contribution.band.central, format, true)} · {EVIDENCE_LABELS[effect.strength]}
      </p>

      <p>{effect.derivation}</p>

      <p>
        {effect.timingNote} By {targetYear} that reaches about {Math.round(exposure * 100)}% of the
        people this figure counts.
      </p>

      <p className="projection__citation">
        <CitationLink citation={effect.citation} />
      </p>

      {effect.supporting?.map(citation => (
        <p className="projection__citation" key={citation.url}>
          Supporting: <CitationLink citation={citation} />
        </p>
      ))}
    </li>
  );
}

function DirectionDetail({ effect }: { effect: DirectionalEffect }) {
  return (
    <li className="projection__source">
      <p className="projection__source-head">
        {LEVERS_BY_ID[effect.lever].label} · pushes this {effect.direction} · no usable size
      </p>

      <p>{effect.derivation}</p>

      <p className="projection__citation">
        <CitationLink citation={effect.citation} />
      </p>
    </li>
  );
}

export function MetricProjection({
  projection,
  horizonYears,
  label,
  series,
  sensitivity,
}: MetricProjectionProps) {
  const { contributions, unquantified, projected } = projection;
  const { format } = DEMOGRAPHICS_META[projection.outcome];
  const strength = overallStrength(projection);
  const targetYear = new Date().getFullYear() + horizonYears;

  const low = formatValue(projected.low, format);
  const high = formatValue(projected.high, format);

  return (
    <div className="projection">
      <p className="projection__head">
        <span>By {targetYear}</span>
        <span className={`projection__badge projection__badge--${strength}`}>
          {EVIDENCE_LABELS[strength]}
        </span>
      </p>

      {contributions.length > 0 ? (
        <>
          <p className="projection__range">{low === high ? low : `${low} – ${high}`}</p>

          <ProjectionChart
            points={series}
            baseline={projection.baseline}
            format={format}
            label={label}
            startYear={targetYear - horizonYears}
          />
        </>
      ) : (
        <p className="projection__empty">{EVIDENCE_NOTES[strength]}</p>
      )}

      {(contributions.length > 0 || unquantified.length > 0) && (
        <details className="projection__details">
          <summary>Where this comes from</summary>

          <ul>
            {contributions.map(contribution => (
              <ContributionDetail
                key={contribution.effect.lever}
                contribution={contribution}
                targetYear={targetYear}
              />
            ))}

            {unquantified.map(effect => (
              <DirectionDetail key={effect.lever} effect={effect} />
            ))}
          </ul>
        </details>
      )}

      {sensitivity.length > 0 && (
        <details className="projection__details">
          <summary>What moves this answer</summary>

          <SensitivityBars rows={sensitivity} central={projected.central} format={format} />
        </details>
      )}
    </div>
  );
}
