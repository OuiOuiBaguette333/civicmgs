import type { SeriesPoint } from "@model/project";
import { clamp } from "@utils";
import type { DemographicFormat } from "@utils/demographics";
import formatValue from "@utils/format";
import { useState } from "react";

interface ProjectionChartProps {
  points: SeriesPoint[];
  baseline: number;
  format: DemographicFormat;
  label: string;
  startYear: number;
}

const WIDTH = 320;
const HEIGHT = 132;
const PAD = { top: 10, right: 12, bottom: 24, left: 48 };
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;

/** Axis ticks on round numbers rather than wherever the data happens to land. */
function niceTicks(min: number, max: number, count = 4) {
  const span = max - min;

  if (span <= 0) return [min];

  const rough = span / (count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map(size => size * magnitude).find(size => size >= rough);
  const chosen = step ?? magnitude * 10;

  const ticks: number[] = [];

  for (let value = Math.ceil(min / chosen) * chosen; value <= max + 1e-9; value += chosen) {
    ticks.push(Number(value.toFixed(6)));
  }

  return ticks;
}

function buildScales(points: SeriesPoint[], baseline: number) {
  const values = [baseline, ...points.flatMap(({ low, high }) => [low, high])];
  const lowest = Math.min(...values);
  const highest = Math.max(...values);

  // A flat projection would otherwise collapse to a zero-height plot.
  const padding = (highest - lowest || Math.abs(baseline) * 0.1 || 1) * 0.12;
  const min = lowest - padding;
  const max = highest + padding;

  const lastYear = points.at(-1)?.yearsAhead || 1;

  return {
    min,
    max,
    x: (yearsAhead: number) => PAD.left + (yearsAhead / lastYear) * PLOT_WIDTH,
    y: (value: number) => PAD.top + (1 - (value - min) / (max - min)) * PLOT_HEIGHT,
  };
}

type Scales = ReturnType<typeof buildScales>;

const linePath = (points: SeriesPoint[], { x, y }: Scales) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.yearsAhead)} ${y(point.central)}`)
    .join(" ");

const bandPath = (points: SeriesPoint[], { x, y }: Scales) =>
  [
    ...points.map(
      (point, index) => `${index === 0 ? "M" : "L"}${x(point.yearsAhead)} ${y(point.high)}`,
    ),
    ...points.toReversed().map(point => `L${x(point.yearsAhead)} ${y(point.low)}`),
    "Z",
  ].join(" ");

function ChartAxes({ scales, format }: { scales: Scales; format: DemographicFormat }) {
  return (
    <>
      {niceTicks(scales.min, scales.max).map(tick => (
        <g key={tick}>
          <line
            className="chart__grid"
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={scales.y(tick)}
            y2={scales.y(tick)}
          />
          <text className="chart__tick" x={PAD.left - 6} y={scales.y(tick) + 3} textAnchor="end">
            {formatValue(tick, format)}
          </text>
        </g>
      ))}
    </>
  );
}

function ChartMarks({
  points,
  scales,
  baseline,
}: {
  points: SeriesPoint[];
  scales: Scales;
  baseline: number;
}) {
  const last = points.at(-1);

  return (
    <>
      <line
        className="chart__baseline"
        x1={PAD.left}
        x2={WIDTH - PAD.right}
        y1={scales.y(baseline)}
        y2={scales.y(baseline)}
      />

      <path className="chart__band" d={bandPath(points, scales)} />
      <path className="chart__line" d={linePath(points, scales)} />

      {last && (
        <circle
          className="chart__end"
          cx={scales.x(last.yearsAhead)}
          cy={scales.y(last.central)}
          r={4}
        />
      )}
    </>
  );
}

function Crosshair({ point, scales }: { point: SeriesPoint; scales: Scales }) {
  return (
    <g>
      <line
        className="chart__crosshair"
        x1={scales.x(point.yearsAhead)}
        x2={scales.x(point.yearsAhead)}
        y1={PAD.top}
        y2={PAD.top + PLOT_HEIGHT}
      />
      <circle
        className="chart__end"
        cx={scales.x(point.yearsAhead)}
        cy={scales.y(point.central)}
        r={4}
      />
    </g>
  );
}

export function ProjectionChart({
  points,
  baseline,
  format,
  label,
  startYear,
}: ProjectionChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const scales = buildScales(points, baseline);
  const last = points.at(-1);
  const endYear = startYear + Math.round(last?.yearsAhead ?? 0);
  const active = hovered === null ? undefined : points[hovered];

  const handleMove = (event: { clientX: number; currentTarget: SVGRectElement }) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHovered(clamp(Math.round(ratio * (points.length - 1)), 0, points.length - 1));
  };

  const summary = `${label} projected from ${formatValue(baseline, format)} now to between ${formatValue(last?.low ?? baseline, format)} and ${formatValue(last?.high ?? baseline, format)} by ${endYear}.`;

  return (
    <div className="chart">
      <svg
        className="chart__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={summary}
      >
        <ChartAxes scales={scales} format={format} />
        <ChartMarks points={points} scales={scales} baseline={baseline} />

        {active && <Crosshair point={active} scales={scales} />}

        <text className="chart__axis" x={PAD.left} y={HEIGHT - 8}>
          {startYear}
        </text>

        <text className="chart__axis" x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">
          {endYear}
        </text>

        <rect
          className="chart__hit"
          x={PAD.left}
          y={PAD.top}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
        />
      </svg>

      {active && (
        <p className="chart__readout">
          {startYear + Math.round(active.yearsAhead)}: {formatValue(active.low, format)} –{" "}
          {formatValue(active.high, format)}
        </p>
      )}
    </div>
  );
}
