interface MetricCardProps {
  label: string
  suburbValue: string
  vicAverageValue: string
  deltaLabel: string
}

export function MetricCard({
  label,
  suburbValue,
  vicAverageValue,
  deltaLabel,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{suburbValue}</p>
      <p className="metric-card__average">VIC average: {vicAverageValue}</p>
      <p className="metric-card__delta">{deltaLabel}</p>
    </article>
  )
}
