import { useEffect, useMemo, useState } from 'react'
import { locationCatalog } from '../../../data/locationCatalog'
import { getMetricSnapshotsForLocation } from '../../../services/absApiService'
import type { LocationRecord, MetricSnapshot } from '../../../types'
import { applyScenarioAdjustments } from '../../simulation/simulationEngine'
import { MetricCard } from './MetricCard'

interface MetricsComparisonSectionProps {
  locationId: string
  year: number
  populationChange: number
  educationFundingChange: number
  infrastructureFundingChange: number
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-AU')
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function deltaLabel(currentValue: number, baselineValue: number, suffix = ''): string {
  const difference = currentValue - baselineValue
  const direction = difference >= 0 ? 'above' : 'below'
  const magnitude = Math.abs(difference)
  return `${magnitude.toFixed(1)}${suffix} ${direction} suburb avg`
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function MetricsComparisonSection({
  locationId,
  year,
  populationChange,
  educationFundingChange,
  infrastructureFundingChange,
}: MetricsComparisonSectionProps) {
  const locations = locationCatalog as LocationRecord[]
  const selectedLocation = locations.find((location) => location.locationId === locationId)
  const [locationSnapshots, setLocationSnapshots] = useState<MetricSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAbsSnapshots() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const snapshots = await getMetricSnapshotsForLocation(locationId, [
          year - 3,
          year - 2,
          year - 1,
          year,
        ])
        if (!cancelled) {
          setLocationSnapshots(snapshots)
        }
      } catch (error) {
        if (!cancelled) {
          setLocationSnapshots([])
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load ABS data.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAbsSnapshots()

    return () => {
      cancelled = true
    }
  }, [locationId, year])

  const selectedSnapshot = locationSnapshots.find(
    (snapshot) => snapshot.locationId === locationId && snapshot.year === year,
  )

  const suburbAverageSnapshot = useMemo<MetricSnapshot | undefined>(() => {
    if (locationSnapshots.length === 0) {
      return undefined
    }
    return {
      locationId,
      year,
      demographics: {
        populationTotal: average(
          locationSnapshots.map((snapshot) => snapshot.demographics.populationTotal),
        ),
        medianAge: average(
          locationSnapshots.map((snapshot) => snapshot.demographics.medianAge),
        ),
        householdMedianIncome: average(
          locationSnapshots.map(
            (snapshot) => snapshot.demographics.householdMedianIncome,
          ),
        ),
        unemploymentRatePct: average(
          locationSnapshots.map((snapshot) => snapshot.demographics.unemploymentRatePct),
        ),
      },
      funding: {
        perCapitaFundingAud: average(
          locationSnapshots.map((snapshot) => snapshot.funding.perCapitaFundingAud),
        ),
        communityProgramsFundingAud: average(
          locationSnapshots.map(
            (snapshot) => snapshot.funding.communityProgramsFundingAud,
          ),
        ),
        infrastructureFundingAud: average(
          locationSnapshots.map((snapshot) => snapshot.funding.infrastructureFundingAud),
        ),
      },
    }
  }, [locationSnapshots, locationId, year])

  if (isLoading) {
    return (
      <section className="metrics-section">
        <p>Loading ABS metrics...</p>
      </section>
    )
  }

  if (!selectedLocation || !selectedSnapshot || !suburbAverageSnapshot) {
    return (
      <section className="metrics-section">
        <p>{errorMessage ?? 'No ABS data available for this location and year.'}</p>
      </section>
    )
  }

  const adjustedSnapshot = applyScenarioAdjustments(selectedSnapshot, {
    populationTotalPct: populationChange,
    communityProgramsFundingAudPct: educationFundingChange,
    infrastructureFundingAudPct: infrastructureFundingChange,
  })

  const demographicCards = [
    {
      label: 'Population',
      suburbValue: formatNumber(adjustedSnapshot.demographics.populationTotal),
      vicAverageValue: formatNumber(suburbAverageSnapshot.demographics.populationTotal),
      deltaLabel: deltaLabel(
        adjustedSnapshot.demographics.populationTotal,
        suburbAverageSnapshot.demographics.populationTotal,
      ),
    },
    {
      label: 'Median age',
      suburbValue: adjustedSnapshot.demographics.medianAge.toFixed(1),
      vicAverageValue: suburbAverageSnapshot.demographics.medianAge.toFixed(1),
      deltaLabel: deltaLabel(
        adjustedSnapshot.demographics.medianAge,
        suburbAverageSnapshot.demographics.medianAge,
        ' years',
      ),
    },
    {
      label: 'Household median income',
      suburbValue: formatCurrency(adjustedSnapshot.demographics.householdMedianIncome),
      vicAverageValue: formatCurrency(suburbAverageSnapshot.demographics.householdMedianIncome),
      deltaLabel: deltaLabel(
        adjustedSnapshot.demographics.householdMedianIncome,
        suburbAverageSnapshot.demographics.householdMedianIncome,
      ),
    },
    {
      label: 'Unemployment rate',
      suburbValue: formatPercent(adjustedSnapshot.demographics.unemploymentRatePct),
      vicAverageValue: formatPercent(suburbAverageSnapshot.demographics.unemploymentRatePct),
      deltaLabel: deltaLabel(
        adjustedSnapshot.demographics.unemploymentRatePct,
        suburbAverageSnapshot.demographics.unemploymentRatePct,
        ' pp',
      ),
    },
  ]

  const fundingCards = [
    {
      label: 'Per-capita funding',
      suburbValue: formatCurrency(adjustedSnapshot.funding.perCapitaFundingAud),
      vicAverageValue: formatCurrency(suburbAverageSnapshot.funding.perCapitaFundingAud),
      deltaLabel: deltaLabel(
        adjustedSnapshot.funding.perCapitaFundingAud,
        suburbAverageSnapshot.funding.perCapitaFundingAud,
      ),
    },
    {
      label: 'Education funding',
      suburbValue: formatCurrency(
        adjustedSnapshot.funding.communityProgramsFundingAud,
      ),
      vicAverageValue: formatCurrency(
        suburbAverageSnapshot.funding.communityProgramsFundingAud,
      ),
      deltaLabel: deltaLabel(
        adjustedSnapshot.funding.communityProgramsFundingAud,
        suburbAverageSnapshot.funding.communityProgramsFundingAud,
      ),
    },
    {
      label: 'Infrastructure funding',
      suburbValue: formatCurrency(adjustedSnapshot.funding.infrastructureFundingAud),
      vicAverageValue: formatCurrency(
        suburbAverageSnapshot.funding.infrastructureFundingAud,
      ),
      deltaLabel: deltaLabel(
        adjustedSnapshot.funding.infrastructureFundingAud,
        suburbAverageSnapshot.funding.infrastructureFundingAud,
      ),
    },
  ]

  return (
    <section className="metrics-section">
      <header className="metrics-section__header">
        <h2>
          {selectedLocation.suburbName} ({selectedLocation.postcode}) vs suburb
          average
        </h2>
        <p>
          Snapshot for {year}, compared against this suburb&apos;s multi-year average.
        </p>
      </header>

      <div className="metrics-section__group">
        <h3>Demographics</h3>
        <div className="metrics-grid">
          {demographicCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </div>

      <div className="metrics-section__group">
        <h3>Funding</h3>
        <div className="metrics-grid">
          {fundingCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
