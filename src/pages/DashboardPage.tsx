import { useEffect, useState } from 'react'
import { LocationSearchPanel } from '../features/location/components/LocationSearchPanel'
import { MetricsComparisonSection } from '../features/metrics/components/MetricsComparisonSection'
import { ScenarioSimulatorPanel } from '../features/simulation/components/ScenarioSimulatorPanel'
import { ENABLE_ABS_API } from '../config/featureFlags'
import { getMetricSnapshotWithAbsFallback } from '../services/absApiService'

export function DashboardPage() {
  const [selectedLocationId, setSelectedLocationId] = useState('au-vic-carlton-3053')
  const [populationChange, setPopulationChange] = useState(0)
  const [educationFundingChange, setEducationFundingChange] = useState(0)
  const [infrastructureFundingChange, setInfrastructureFundingChange] = useState(0)

  const selectedYear = 2024

  useEffect(() => {
    let isMounted = true

    async function testAbsFetch() {
      try {
        const snapshot = await getMetricSnapshotWithAbsFallback(
          selectedLocationId,
          selectedYear,
        )

        if (!isMounted) {
          return
        }

        console.log(
          '[CivicLens] ABS test fetch result',
          {
            enableAbsApi: ENABLE_ABS_API,
            locationId: selectedLocationId,
            year: selectedYear,
          },
          snapshot,
        )
      } catch (error) {
        console.error('[CivicLens] ABS test fetch failed.', error)
      }
    }

    void testAbsFetch()

    return () => {
      isMounted = false
    }
  }, [selectedLocationId, selectedYear])

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <p className="dashboard-page__eyebrow">CivicLens MVP</p>
        <h1>Melbourne suburb snapshot</h1>
        <p>
          Static comparison view using mock Victorian data. Simulation features are
          intentionally disabled for now.
        </p>
      </header>

      <LocationSearchPanel
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
      />
      <ScenarioSimulatorPanel
        populationChange={populationChange}
        onPopulationChange={setPopulationChange}
        educationFundingChange={educationFundingChange}
        onEducationFundingChange={setEducationFundingChange}
        infrastructureFundingChange={infrastructureFundingChange}
        onInfrastructureFundingChange={setInfrastructureFundingChange}
      />
      <MetricsComparisonSection
        locationId={selectedLocationId}
        year={selectedYear}
        populationChange={populationChange}
        educationFundingChange={educationFundingChange}
        infrastructureFundingChange={infrastructureFundingChange}
      />
    </main>
  )
}
