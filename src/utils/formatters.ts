export function formatNumber(value: number): string {
  return value.toLocaleString('en-AU')
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function createDeltaLabel(currentValue: number, baselineValue: number, decimalPlaces: number, suffix = ''): string {
  const difference = currentValue - baselineValue
  const direction = difference >= 0 ? 'above' : 'below'
  const magnitude = Math.abs(difference)
  return `${magnitude.toFixed(decimalPlaces)}${suffix} ${direction} suburb avg`
}

export function createCurrencyDeltaLabel(currentValue: number, baselineValue: number) {
  const difference = currentValue - baselineValue
  const direction = difference >= 0 ? 'above' : 'below'
  const magnitude = Math.abs(difference)
  return `${formatCurrency(magnitude)} ${direction} suburb avg`
}
