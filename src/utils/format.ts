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
  // Compared as displayed, so "same" can never contradict two identical-looking
  // numbers on screen — which an exact float comparison would let it do.
  if (formatValue(value, format) === formatValue(baseline, format)) {
    return { label: "Same as Victoria", tone: "neutral" };
  }

  const difference = value - baseline;
  const isAbove = difference > 0;
  const label = `${formatValue(Math.abs(difference), format, true)} ${isAbove ? "above" : "below"} Victoria`;

  if (direction === "neutral") return { label, tone: "neutral" };

  const isBetter = direction === "higher" ? isAbove : !isAbove;

  return { label, tone: isBetter ? "positive" : "negative" };
}
