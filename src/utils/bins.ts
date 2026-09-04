/** Number of colour steps the map uses. Must match the --map-N custom properties. */
export const BIN_COUNT = 6;

/**
 * Quantile breaks: each bin holds roughly the same number of areas.
 *
 * Equal-width bins would be more faithful to magnitude, but census measures are
 * skewed enough that most areas would land in one or two colours and the map
 * would say nothing. Quantiles spread the ink; the legend prints the real
 * values so the skew stays visible.
 */
export function quantileBreaks(values: number[], bins = BIN_COUNT): number[] {
  const sorted = values.filter(value => Number.isFinite(value)).toSorted((a, b) => a - b);

  if (sorted.length === 0) return [];

  const breaks: number[] = [];

  for (let index = 1; index < bins; index += 1) {
    const position = (index / bins) * (sorted.length - 1);
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    const weight = position - lower;

    breaks.push(sorted[lower] + (sorted[upper] - sorted[lower]) * weight);
  }

  return breaks;
}

/** The bin an area falls in, from 0 to breaks.length. */
export function binOf(value: number, breaks: number[]): number {
  let bin = 0;

  while (bin < breaks.length && value >= breaks[bin]) bin += 1;

  return bin;
}
