import { ElectorateCard } from "@components/ElectorateCard";
import { type ElectorateData, useElectorates } from "@hooks/useElectorates";
import type { ElectorateSummary } from "@model/electorates";
import { marginOf, seatByDistrict } from "@model/seats";
import type { Location } from "@types";
import type { Demographic } from "@utils/demographics";
import { type ReactNode, useMemo, useState } from "react";

/** Districts missing a figure sort last, whichever way the column runs. */
const byMetric = (metric: Demographic) => (a: ElectorateSummary, b: ElectorateSummary) =>
  (b.figures[metric] ?? -Infinity) - (a.figures[metric] ?? -Infinity);

/** Districts with no recorded result sort last rather than as ultra-marginal. */
const marginOfDistrict = (electorate: ElectorateSummary) => {
  const seat = seatByDistrict.get(electorate.name);

  return seat ? marginOf(seat) : Infinity;
};

const SORTS = {
  name: { label: "Name (A–Z)", compare: (a, b) => a.name.localeCompare(b.name) },
  margin: {
    label: "Most marginal",
    compare: (a: ElectorateSummary, b: ElectorateSummary) =>
      marginOfDistrict(a) - marginOfDistrict(b),
  },
  population: { label: "Largest population", compare: byMetric("population") },
  income: {
    label: "Highest median income",
    compare: byMetric("medianEquivalisedHouseholdIncome"),
  },
  unemployment: { label: "Highest unemployment", compare: byMetric("unemploymentRate") },
} satisfies Record<
  string,
  { label: string; compare: (a: ElectorateSummary, b: ElectorateSummary) => number }
>;

type SortKey = keyof typeof SORTS;

const SORT_KEYS = Object.keys(SORTS) as SortKey[];

const ALL_REGIONS = "all";

/** The suburbs inside a district whose names contain the search. */
const matchingSuburbs = (
  electorate: ElectorateSummary,
  names: Map<string, string>,
  needle: string,
) =>
  electorate.areas
    .map(code => names.get(code) ?? code)
    .filter(name => name.toLowerCase().includes(needle))
    .toSorted((a, b) => a.localeCompare(b));

/** A district matches on its own name or on any suburb inside it. */
const matches = (electorate: ElectorateSummary, names: Map<string, string>, needle: string) =>
  electorate.name.toLowerCase().includes(needle) ||
  matchingSuburbs(electorate, names, needle).length > 0;

interface FilterProps {
  label: string;
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Filter({ label, id, value, options, onChange }: FilterProps) {
  return (
    <div className="directory__field">
      <label className="caps" htmlFor={id}>
        {label}
      </label>

      <select
        className="directory__input"
        id={id}
        onChange={event => onChange(event.target.value)}
        value={value}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  region: string;
  regions: { value: string; label: string }[];
  onRegionChange: (region: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}

function Controls(props: ControlsProps) {
  return (
    <div className="directory__controls">
      <div className="directory__field directory__field--search">
        <label className="caps" htmlFor="directory-search">
          Search
        </label>

        <svg
          className="directory__icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </svg>

        <input
          className="directory__input"
          id="directory-search"
          onChange={event => props.onQueryChange(event.target.value)}
          placeholder="Districts and suburbs"
          type="search"
          value={props.query}
        />
      </div>

      <Filter
        id="directory-region"
        label="Council region"
        onChange={props.onRegionChange}
        options={[{ value: ALL_REGIONS, label: "All regions" }, ...props.regions]}
        value={props.region}
      />

      <Filter
        id="directory-sort"
        label="Sort by"
        onChange={value => props.onSortChange(value as SortKey)}
        options={SORT_KEYS.map(key => ({ value: key, label: SORTS[key].label }))}
        value={props.sort}
      />
    </div>
  );
}

/** The section head, with room beside the title for the count of districts. */
function DirectoryHead({ children }: { children?: ReactNode }) {
  return (
    <div className="rule-head">
      <h2 id="districts-title">Electoral districts</h2>
      {children}
    </div>
  );
}

const LEDE =
  "Each district’s figures are its suburbs combined: population is a sum and rates are weighted by population. Suburbs are matched to the district containing their centre, so one straddling a boundary is counted wholly on one side.";

interface DirectoryProps {
  data: ElectorateData;
  onSelectArea: (location: Location) => void;
}

function Directory({ data, onSelectArea }: DirectoryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [region, setRegion] = useState(ALL_REGIONS);

  const regions = useMemo(
    () =>
      [...new Set(data.electorates.map(electorate => electorate.region).filter(Boolean))]
        .toSorted()
        .map(name => ({ value: name as string, label: name as string })),
    [data],
  );

  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return data.electorates
      .filter(electorate => region === ALL_REGIONS || electorate.region === region)
      .filter(electorate => !needle || matches(electorate, data.names, needle))
      .toSorted(SORTS[sort].compare);
  }, [data, needle, region, sort]);

  return (
    <>
      <DirectoryHead>
        <p className="directory__count caps" role="status">
          {visible.length} of {data.electorates.length} districts
          {region !== ALL_REGIONS && ` in ${region}`}
        </p>
      </DirectoryHead>

      <div className="directory__intro">
        <p className="directory__lede">{LEDE}</p>

        <Controls
          onQueryChange={setQuery}
          onRegionChange={setRegion}
          onSortChange={setSort}
          query={query}
          region={region}
          regions={regions}
          sort={sort}
        />
      </div>

      <div className="directory__grid">
        {visible.map((electorate, index) => (
          <ElectorateCard
            electorate={electorate}
            index={index}
            figures={data.figures}
            matched={needle ? matchingSuburbs(electorate, data.names, needle) : []}
            key={electorate.code}
            names={data.names}
            onSelectArea={onSelectArea}
            seat={seatByDistrict.get(electorate.name)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="directory__status">Nothing here matches those filters.</p>
      )}
    </>
  );
}

function Pending({ state, retry }: { state: "loading" | "failed"; retry: () => void }) {
  if (state === "failed") {
    return (
      <p className="directory__status" role="status">
        The district figures could not be loaded.{" "}
        <button type="button" onClick={retry}>
          Try again
        </button>
      </p>
    );
  }

  return (
    <>
      <p className="visually-hidden" role="status">
        Loading districts…
      </p>

      <div className="directory__skeleton" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="skeleton" key={index} />
        ))}
      </div>
    </>
  );
}

export function ElectorateDirectory({
  onSelectArea,
}: {
  onSelectArea: DirectoryProps["onSelectArea"];
}) {
  const { state, retry } = useElectorates();

  if (state.status !== "ready") {
    return (
      <>
        <DirectoryHead />
        <Pending state={state.status} retry={retry} />
      </>
    );
  }

  if (state.data.electorates.length === 0) {
    return (
      <>
        <DirectoryHead />
        <p className="directory__status">
          No electorate boundaries are built yet. The join between districts and suburbs is produced
          offline by <code>npm run data:electorates</code>, which needs the ABS state electoral
          division boundaries alongside the statistical areas.
        </p>
      </>
    );
  }

  return <Directory data={state.data} onSelectArea={onSelectArea} />;
}
