import type { DemographicDirection, DemographicFormat } from "@utils/demographics";

const countFormat = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

const currencyFormat = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const decimalFormat = new Intl.NumberFormat("en-AU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Rounding happens here rather than in the model, so that a simulated value is
 * only rounded once, on the way to the screen.
 */
export default function formatValue(
  value: number,
  format: DemographicFormat,
  asDelta = false,
): string {
  switch (format) {
    case "currency":
      return currencyFormat.format(value);
    case "percent":
      // A difference between two percentages is measured in percentage points.
      return `${decimalFormat.format(value)}${asDelta ? " pp" : "%"}`;
    case "years":
      return `${decimalFormat.format(value)} years`;
    case "count":
      return countFormat.format(value);
  }
}

export type DeltaTone = "positive" | "negative" | "neutral";

export interface Delta {
  label: string;
  tone: DeltaTone;
}

interface DeltaOptions {
  format: DemographicFormat;
  direction: DemographicDirection;
}

export function createDelta(
  value: number,
  baseline: number,
  { format, direction }: DeltaOptions,
): Delta {
  const difference = value - baseline;
  const size = formatValue(Math.abs(difference), format, true);

  // Compared as displayed, so "same" can never contradict two identical-looking
  // numbers on screen — which an exact float comparison would let it do. The
  // difference itself is checked too: two values that straddle a rounding
  // boundary print differently but their gap can still round to nothing, and
  // "0.0 pp above" is not a sentence anyone should read.
  if (
    formatValue(value, format) === formatValue(baseline, format) ||
    size === formatValue(0, format, true)
  ) {
    return { label: "Same as Victoria", tone: "neutral" };
  }

  // The state's own figure sits beside this on the page, so the label only
  // says which way and by how much: "0.4 pp below", next to "Victoria 61.8%".
  const isAbove = difference > 0;
  const label = `${size} ${isAbove ? "above" : "below"}`;

  if (direction === "neutral") return { label, tone: "neutral" };

  const isBetter = direction === "higher" ? isAbove : !isAbove;

  return { label, tone: isBetter ? "positive" : "negative" };
}
