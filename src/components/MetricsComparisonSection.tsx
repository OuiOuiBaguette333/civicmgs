import format, { createDeltaLabel } from '@utils/format'
import { DEMOGRAPHICS_FORMATS, DEMOGRAPHICS_LABELS, type Demographic, type Demographics } from '@utils/demographics'
import fetchDemographics from '@utils/fetchDemographics'
import type { Location } from '@types'
import { MetricCard, type MetricCardProps } from '@components/MetricCard'
import simulate from '@utils/simulate'
import { useEffect, useState } from 'react'
import { VICTORIAN_AVERAGES, YEAR } from '@data/abs'

interface MetricsComparisonSectionProps {
  location?: Location
  simulatedDemographicsChanges: Demographics
}

export function MetricsComparisonSection({
  location,
  simulatedDemographicsChanges,
}: MetricsComparisonSectionProps) {
  const [demographics, setDemographics] = useState<Demographics | null>(null)

  useEffect(() => {
    let ignore = false
    setDemographics(null)

    if (!location) return

    fetchDemographics(location.code).then(data => {
      if (!ignore) setDemographics(data)
    })

    return () => {
      ignore = true
    }
  }, [location])

  if (!location || !demographics) {
    return (
      <section className="metrics-section">
        <p>{location ? 'Loading...' : 'Please select a suburb'}</p>
      </section>
    )
  }

  const simulatedDemographicsEntries = Object
    .entries(demographics)
    .map(([metric, value]) => [metric, simulate(value, simulatedDemographicsChanges[metric as Demographic])] as [Demographic, number])

  const demographicCards: MetricCardProps[] = simulatedDemographicsEntries.map(([metric, simulatedValue]) => {
    const victorianAverage = VICTORIAN_AVERAGES[metric]

    return {
      label: DEMOGRAPHICS_LABELS[metric],
      suburbValue: format(simulatedValue, DEMOGRAPHICS_FORMATS[metric]),
      vicAverageValue: format(victorianAverage, DEMOGRAPHICS_FORMATS[metric]),
      deltaLabel: createDeltaLabel(simulatedValue, victorianAverage, DEMOGRAPHICS_FORMATS[metric])
    }
  })

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
