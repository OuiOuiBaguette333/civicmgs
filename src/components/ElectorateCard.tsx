import type { Seat } from "@data/seats2022";
import { type AreaFigures, type ElectorateSummary, isAveragedMedian } from "@model/electorates";
import { marginOf, safenessOf, WIDEST_MARGIN } from "@model/seats";
import type { Location } from "@types";
import { type Demographic, DEMOGRAPHICS_META } from "@utils/demographics";
import formatValue from "@utils/format";
import type { CSSProperties } from "react";

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
  medianEquivalisedHouseholdIncome: "Household income",
  unemploymentRate: "Unemployed",
  year12Completion: "Year 12",
};

const shortLabel = (metric: Demographic) => SHORT_LABELS[metric] ?? DEMOGRAPHICS_META[metric].label;

const show = (metric: Demographic, value?: number) =>
  value === undefined ? "—" : formatValue(value, DEMOGRAPHICS_META[metric].format);

interface FigureProps {
  metric: Demographic;
  value?: number;
  /**
   * Whether this figure is a district roll-up rather than a published number.
   * The dagger marks a median that has been averaged, which is only true of the
   * aggregate: a suburb's own median is exactly what the ABS published.
   */
  aggregated?: boolean;
}

function Figure({ metric, value, aggregated = false }: FigureProps) {
  return (
    <div className="figure">
      <dt className="figure__label">
        {/* One run of text, so the dagger wraps with the words rather than beside them. */}
        <span>
          {shortLabel(metric)}
          {aggregated && isAveragedMedian(metric) && <span className="figure__flag">&nbsp;†</span>}
        </span>
      </dt>
      <dd className="figure__value">{show(metric, value)}</dd>
    </div>
  );
}

/**
 * How the district last voted. Every party is drawn the same way, deliberately:
 * a party colour here would make the page look like it was arguing for someone.
 * The bar carries magnitude through its length alone, on one scale across the
 * state, so the hue means nothing and cannot be read as a side.
 */
function Held({ seat }: { seat: Seat }) {
  const margin = marginOf(seat);

  return (
    <div className="held">
      <p className="held__line">
        <span className="held__party caps">{seat.party}</span>
        <span className="held__margin">{margin.toFixed(1)}%</span>
        <span className="held__safeness">{safenessOf(margin)}</span>
      </p>

      <div className="held__track">
        <div className="held__fill" style={{ width: `${(margin / WIDEST_MARGIN) * 100}%` }} />
      </div>

      <p className="held__member">{seat.member}, elected 2022</p>
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
    <ul className="suburbs" role="list">
      {suburbs.map(suburb => (
        <li className="suburbs__item" key={suburb.code}>
          <button
            className="link-button suburbs__name"
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

interface ElectorateCardProps extends SuburbListProps {
  seat?: Seat;
  /** Suburbs that matched a search, so a card can say why it is in the list. */
  matched?: string[];
  /** Position in the list, which sets how long the card waits before it appears. */
  index?: number;
}

export function ElectorateCard({
  electorate,
  names,
  figures,
  seat,
  matched = [],
  index = 0,
  onSelectArea,
}: ElectorateCardProps) {
  const { population } = electorate.figures;

  return (
    <article className="district" style={{ "--i": index } as CSSProperties}>
      <header className="district__header">
        <h3 className="district__name">{electorate.name}</h3>

        {electorate.region && <p className="district__region caps">{electorate.region}</p>}

        <p className="district__meta">
          {population === undefined ? "Population not published" : show("population", population)}
          {" · "}
          {electorate.areas.length} {electorate.areas.length === 1 ? "suburb" : "suburbs"}
          {electorate.withoutFigures > 0 && ` · ${electorate.withoutFigures} without figures`}
        </p>

        {matched.length > 0 && (
          <p className="district__match">
            Includes {matched.slice(0, 3).join(", ")}
            {matched.length > 3 && ` and ${matched.length - 3} more`}
          </p>
        )}
      </header>

      {seat && <Held seat={seat} />}

      <dl className="district__stats">
        {HEADLINE_METRICS.map(metric => (
          <Figure key={metric} metric={metric} value={electorate.figures[metric]} aggregated />
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
