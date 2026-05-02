function formatNumber(value: number) {
  return value.toLocaleString('en-AU')
}

// function formatCurrency(value: number) {
//   return value.toLocaleString('en-AU', {
//     style: 'currency',
//     currency: 'AUD',
//     maximumFractionDigits: 0,
//   })
// }

// function formatPercent(value: number) {
//   return `${value.toFixed(1)}%`
// }

export default (value: number, format: string) => {
  switch (format) {
    default:
      return formatNumber(value)
  }
}

export function createDeltaLabel(currentValue: number, baselineValue: number, format: string) {
  const difference = currentValue - baselineValue
  const direction = difference >= 0 ? 'above' : 'below'
  const magnitude = Math.abs(difference)

  switch (format) {
    default:
      return `${formatNumber(magnitude)} ${direction} VIC avg`
  }
}
