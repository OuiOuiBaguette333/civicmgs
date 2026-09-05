import { type AreaFigures, type ElectorateSummary, isAveragedMedian } from "@model/electorates";
import type { Location } from "@types";
import { type Demographic, DEMOGRAPHICS_META } from "@utils/demographics";
import formatValue from "@utils/format";

/** The figures a district leads with, and the ones shown under each suburb. */
export const HEADLINE_METRICS: Demographic[] = [
  "medianEquivalisedHouseholdIncome",
  "unemploymentRate",
  "year12Completion",
];

/**
 * A card is a column of a grid, not a page: the full measure names wrap to three
 * lines and push the figures out of line with each other. These are the same
 * measures under names that fit, with the full ones still on the metric cards.
 */
const SHORT_LABELS: Partial<Record<Demographic, string>> = {
  population: "People",
  medianEquivalisedHouseholdIncome: "Median income",
  unemploymentRate: "Unemployment",
  year12Completion: "Year 12",
};

const shortLabel = (metric: Demographic) => SHORT_LABELS[metric] ?? DEMOGRAPHICS_META[metric].label;

const show = (metric: Demographic, value?: number) =>
  value === undefined ? "—" : formatValue(value, DEMOGRAPHICS_META[metric].format);

function Figure({ metric, value }: { metric: Demographic; value?: number }) {
  return (
    <div className="figure">
      <dt className="figure__label">
        {shortLabel(metric)}
        {isAveragedMedian(metric) && <span className="figure__flag">&nbsp;†</span>}
      </dt>
      <dd className="figure__value">{show(metric, value)}</dd>
    </div>
  );
}

interface SuburbListProps {
  electorate: ElectorateSummary;
  names: Map<string, string>;
  figures: AreaFigures;
  onSelectArea: (location: Location) => void;
}

function SuburbList({ electorate, names, figures, onSelectArea }: SuburbListProps) {
  const suburbs = electorate.areas
    .map(code => ({ code, name: names.get(code) ?? code, values: figures[code] }))
    .toSorted((a, b) => a.name.localeCompare(b.name));

  return (
    <ul className="suburbs">
      {suburbs.map(suburb => (
        <li className="suburbs__item" key={suburb.code}>
          <button
            className="suburbs__name"
            onClick={() => onSelectArea({ code: suburb.code, name: suburb.name })}
            type="button"
          >
            {suburb.name}
          </button>

          {suburb.values ? (
            <dl className="suburbs__figures">
              <Figure metric="population" value={suburb.values.population} />

              {HEADLINE_METRICS.map(metric => (
                <Figure key={metric} metric={metric} value={suburb.values?.[metric]} />
              ))}
            </dl>
          ) : (
            <p className="suburbs__empty">The ABS publishes no figures for this area.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ElectorateCard({ electorate, names, figures, onSelectArea }: SuburbListProps) {
  const { population } = electorate.figures;

  return (
    <article className="district">
      <header className="district__header">
        <h3 className="district__name">{electorate.name}</h3>

        {electorate.region && <p className="district__region">{electorate.region}</p>}

        <p className="district__meta">
          {population === undefined ? "Population not published" : show("population", population)}
          {" · "}
          {electorate.areas.length} {electorate.areas.length === 1 ? "suburb" : "suburbs"}
          {electorate.withoutFigures > 0 && ` · ${electorate.withoutFigures} without figures`}
        </p>
      </header>

      <dl className="district__stats">
        {HEADLINE_METRICS.map(metric => (
          <Figure key={metric} metric={metric} value={electorate.figures[metric]} />
        ))}
      </dl>

      <details className="district__areas">
        <summary className="district__summary">Suburbs in {electorate.name}</summary>

        <SuburbList
          electorate={electorate}
          figures={figures}
          names={names}
          onSelectArea={onSelectArea}
        />
      </details>
    </article>
  );
}
