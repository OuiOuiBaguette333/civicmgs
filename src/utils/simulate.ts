/**
 * Applies a percentage change to a baseline figure. Deliberately unrounded:
 * rounding belongs at the point of display, not inside the model, where it
 * would quietly destroy the precision of rates and percentages.
 */
export default (value: number, percentChange = 0) => value * (1 + percentChange / 100);
