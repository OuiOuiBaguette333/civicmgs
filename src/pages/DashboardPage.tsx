import { useState } from 'react'
import { LocationSearchPanel } from '@components/LocationSearchPanel'
import { MetricsComparisonSection } from '@components/MetricsComparisonSection'
import { ScenarioSimulatorPanel } from '@components/ScenarioSimulatorPanel'
import type { Location } from '@types'

export function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>()
  const [populationChange, setPopulationChange] = useState(0)

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <p className="dashboard-page__eyebrow">CivicLens MVP</p>
        <h1>Victorian suburb snapshot</h1>
        <p>Simulation features are intentionally disabled for now.</p>
      </header>

      <LocationSearchPanel
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
      />

      <ScenarioSimulatorPanel
        populationChange={populationChange}
        onPopulationChange={setPopulationChange}
      />

      <MetricsComparisonSection
        location={selectedLocation}
        populationChange={populationChange}
      />
    </main>
  )
}
