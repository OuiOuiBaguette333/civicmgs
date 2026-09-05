import { ElectorateCard } from "@components/ElectorateCard";
import { type ElectorateData, useElectorates } from "@hooks/useElectorates";
import type { ElectorateSummary } from "@model/electorates";
import type { Location } from "@types";
import type { Demographic } from "@utils/demographics";
import { useMemo, useState } from "react";

/** Districts missing a figure sort last, whichever way the column runs. */
const byMetric = (metric: Demographic) => (a: ElectorateSummary, b: ElectorateSummary) =>
  (b.figures[metric] ?? -Infinity) - (a.figures[metric] ?? -Infinity);

const SORTS = {
  name: { label: "Name (A–Z)", compare: (a, b) => a.name.localeCompare(b.name) },
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

/** A district matches on its own name or on any suburb inside it. */
const matches = (electorate: ElectorateSummary, names: Map<string, string>, needle: string) =>
  electorate.name.toLowerCase().includes(needle) ||
  electorate.areas.some(code => names.get(code)?.toLowerCase().includes(needle));

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
      <label className="directory__label" htmlFor={id}>
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
      <div className="directory__field">
        <label className="directory__label" htmlFor="directory-search">
          Search districts and suburbs
        </label>

        <input
          className="directory__input"
          id="directory-search"
          onChange={event => props.onQueryChange(event.target.value)}
          placeholder="Bendigo, Frankston, Werribee…"
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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return data.electorates
      .filter(electorate => region === ALL_REGIONS || electorate.region === region)
      .filter(electorate => !needle || matches(electorate, data.names, needle))
      .toSorted(SORTS[sort].compare);
  }, [data, query, region, sort]);

  return (
    <>
      <Controls
        onQueryChange={setQuery}
        onRegionChange={setRegion}
        onSortChange={setSort}
        query={query}
        region={region}
        regions={regions}
        sort={sort}
      />

      <p className="directory__count" role="status">
        {visible.length} of {data.electorates.length} districts
        {region !== ALL_REGIONS && ` in ${region}`}
      </p>

      <div className="directory__grid">
        {visible.map(electorate => (
          <ElectorateCard
            electorate={electorate}
            figures={data.figures}
            key={electorate.code}
            names={data.names}
            onSelectArea={onSelectArea}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="directory__status">Nothing here matches those filters.</p>
      )}
    </>
  );
}

export function ElectorateDirectory({
  onSelectArea,
}: {
  onSelectArea: DirectoryProps["onSelectArea"];
}) {
  const state = useElectorates();

  if (state.status === "loading") {
    return (
      <p className="directory__status" role="status">
        Loading districts…
      </p>
    );
  }

  if (state.data.electorates.length === 0) {
    return (
      <p className="directory__status">
        No electorate boundaries are built yet. The join between districts and suburbs is produced
        offline by <code>npm run data:electorates</code>, which needs the ABS state electoral
        division boundaries alongside the statistical areas.
      </p>
    );
  }

  return <Directory data={state.data} onSelectArea={onSelectArea} />;
}
