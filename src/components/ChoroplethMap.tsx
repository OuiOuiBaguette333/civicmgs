import { type AreaShape, useChoroplethData } from "@hooks/useChoroplethData";
import type { Location } from "@types";
import { BIN_COUNT, binOf, quantileBreaks } from "@utils/bins";
import { DEMOGRAPHICS, DEMOGRAPHICS_META, type Demographic } from "@utils/demographics";
import formatValue from "@utils/format";
import { useState, type ReactNode } from "react";

interface ChoroplethMapProps {
  metric: Demographic;
  onMetricChange: (metric: Demographic) => void;
  selectedCode?: string;
  onSelect: (location: Location) => void;
}

function Legend({ breaks, metric }: { breaks: number[]; metric: Demographic }) {
  const { format } = DEMOGRAPHICS_META[metric];

  return (
    <div className="choropleth__legend">
      {Array.from({ length: BIN_COUNT }, (_, bin) => (
        <span className="choropleth__key" key={bin}>
          <span className={`choropleth__swatch choropleth__swatch--${bin}`} aria-hidden="true" />
          {bin === 0
            ? `under ${formatValue(breaks[0], format)}`
            : formatValue(breaks[bin - 1], format)}
        </span>
      ))}

      <span className="choropleth__key">
        <span className="choropleth__swatch choropleth__swatch--none" aria-hidden="true" />
        no data
      </span>
    </div>
  );
}

function MapStatus({ children }: { children: ReactNode }) {
  return (
    <section className="choropleth">
      <p className="metrics-section__status" role="status">
        {children}
      </p>
    </section>
  );
}

function MetricPicker({
  metric,
  onMetricChange,
}: Pick<ChoroplethMapProps, "metric" | "onMetricChange">) {
  return (
    <div className="choropleth__head">
      <label htmlFor="map-metric">Map</label>

      <select
        id="map-metric"
        value={metric}
        onChange={event => onMetricChange(event.target.value as Demographic)}
      >
        {DEMOGRAPHICS.map(option => (
          <option key={option} value={option}>
            {DEMOGRAPHICS_META[option].label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface AreaPathsProps {
  shapes: AreaShape[];
  breaks: number[];
  valueOf: (code: string) => number | undefined;
  selectedCode?: string;
  onHover: (shape: AreaShape) => void;
  onSelect: (location: Location) => void;
}

function AreaPaths({ shapes, breaks, valueOf, selectedCode, onHover, onSelect }: AreaPathsProps) {
  return (
    <>
      {shapes
        .toSorted((a, b) => Number(a.code === selectedCode) - Number(b.code === selectedCode))
        .map(shape => {
          const value = valueOf(shape.code);
          const bin = value === undefined ? "none" : binOf(value, breaks);
          const selected = shape.code === selectedCode ? " choropleth__area--selected" : "";

          return (
            <path
              key={shape.code}
              d={shape.d}
              className={`choropleth__area choropleth__area--${bin}${selected}`}
              onMouseEnter={() => onHover(shape)}
              onClick={() => onSelect({ code: shape.code, name: shape.name })}
            />
          );
        })}
    </>
  );
}

export function ChoroplethMap({
  metric,
  onMetricChange,
  selectedCode,
  onSelect,
}: ChoroplethMapProps) {
  const state = useChoroplethData();
  const [hovered, setHovered] = useState<AreaShape | null>(null);

  if (state.status === "loading") return <MapStatus>Loading the map…</MapStatus>;

  const { viewBox, shapes, values } = state.data;
  const { format, label } = DEMOGRAPHICS_META[metric];
  const valueOf = (code: string) => values[code]?.[metric];
  const measured = shapes.map(shape => valueOf(shape.code)).filter(value => value !== undefined);
  const breaks = quantileBreaks(measured);
  const readout = hovered ?? shapes.find(shape => shape.code === selectedCode);
  const readoutValue = readout && valueOf(readout.code);

  return (
    <section className="choropleth">
      <MetricPicker metric={metric} onMetricChange={onMetricChange} />

      {measured.length === 0 ? (
        <p className="metrics-section__status" role="status">
          Map figures have not been built yet. Run <code>npm run data:metrics</code> to fetch them
          once from the ABS.
        </p>
      ) : (
        <>
          <div className="choropleth__plot">
            <svg
              className="choropleth__svg"
              viewBox={viewBox}
              role="img"
              aria-label={`${label} across ${measured.length} Victorian areas. Use the suburb search to select an area.`}
              onMouseLeave={() => setHovered(null)}
            >
              <AreaPaths
                shapes={shapes}
                breaks={breaks}
                valueOf={valueOf}
                selectedCode={selectedCode}
                onHover={setHovered}
                onSelect={onSelect}
              />
            </svg>
          </div>

          <p className="choropleth__readout" role="status">
            {readout
              ? `${readout.name} — ${readoutValue === undefined ? "not available" : formatValue(readoutValue, format)}`
              : "Hover an area to read it, or click to select it."}
          </p>

          <Legend breaks={breaks} metric={metric} />
        </>
      )}
    </section>
  );
}
