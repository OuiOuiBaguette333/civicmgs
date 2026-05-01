import { createDeltaLabel, formatNumber } from '@utils/formatters'
import fetchABSData, { type ABSData } from '@utils/fetchABSData'
import type { Location } from '@types'
import { MetricCard, type MetricCardProps } from './MetricCard'
import simulate from '@utils/simulate'
import { useEffect, useState } from 'react'
import { VICTORIAN_AVERAGES, YEAR } from '@data/abs/meta'

interface MetricsComparisonSectionProps {
  location?: Location
  populationChange: number
}

export function MetricsComparisonSection({
  location,
  populationChange,
}: MetricsComparisonSectionProps) {
  const [absData, setAbsData] = useState<ABSData | null>(null)

  useEffect(() => {
    let ignore = false
    setAbsData(null)

    if (!location) return

    fetchABSData(location.code, YEAR).then(data => {
      if (!ignore) setAbsData(data)
    })

    return () => {
      ignore = true
    }
  }, [location])

  if (!location || !absData) {
    return (
      <section className="metrics-section">
        <p>{location ? 'Loading...' : 'Please select a suburb'}</p>
      </section>
    )
  }

  const simulatedAbsData: ABSData = {
    population: simulate(absData.population, populationChange)
  }

  const demographicCards: MetricCardProps[] = [
    {
      label: 'Population',
      suburbValue: formatNumber(simulatedAbsData.population),
      vicAverageValue: formatNumber(VICTORIAN_AVERAGES.population),
      deltaLabel: createDeltaLabel(
        simulatedAbsData.population,
        VICTORIAN_AVERAGES.population,
        0
      ),
    }
  ]

  return (
    <section className="metrics-section">
      <header className="metrics-section__header">
        <h2>{location.name} vs Victorian average</h2>
        <p>Snapshot for {YEAR}, compared against the Victorian average.</p>
      </header>

      <div className="metrics-section__group">
        <h3>Demographics</h3>
        <div className="metrics-grid">
          {demographicCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
