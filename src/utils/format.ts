function formatNumber(value: number) {
  return value.toLocaleString("en-AU");
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number, delta = false) {
  const roundedValue = value.toFixed(1);
  return delta ? `${roundedValue} pp` : `${roundedValue}%`;
}

export default function formatValue(value: number, format?: string, delta = false) {
  const singularUnit = Boolean(value === 1);

  switch (format) {
    case "$":
      return formatCurrency(value);
    case "%":
      return formatPercent(value, delta);
    case "years":
      return `${formatNumber(value)} ${singularUnit ? "year" : "years"}`;
    default:
      return formatNumber(value);
  }
}

export function createDeltaLabel(currentValue: number, baselineValue: number, format?: string) {
  const difference = currentValue - baselineValue;

  if (difference === 0) {
    return "Same as VIC avg";
  }

  const direction = difference >= 0 ? "above" : "below";
  const magnitude = Math.abs(difference);

  return `${formatValue(magnitude, format, true)} ${direction} VIC avg`;
}
