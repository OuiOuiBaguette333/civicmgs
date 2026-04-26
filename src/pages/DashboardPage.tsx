import { useState } from 'react'
import { LocationSearchPanel } from '../features/location/components/LocationSearchPanel'
import { MetricsComparisonSection } from '../features/metrics/components/MetricsComparisonSection'
import { ScenarioSimulatorPanel } from '../features/simulation/components/ScenarioSimulatorPanel'

export function DashboardPage() {
  const [selectedLocationId, setSelectedLocationId] = useState('au-vic-carlton-3053')
  const [populationChange, setPopulationChange] = useState(0)
  const [educationFundingChange, setEducationFundingChange] = useState(0)
  const [infrastructureFundingChange, setInfrastructureFundingChange] = useState(0)

  const selectedYear = 2024
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
