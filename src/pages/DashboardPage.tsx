import { LocationSearchPanel } from "@components/LocationSearchPanel";
import { MetricsComparisonSection } from "@components/MetricsComparisonSection";
import { SimulatorPanel } from "@components/SimulatorPanel";
import type { Location } from "@types";
import { DEMOGRAPHICS_LABELS, ZEROED_CHANGEABLE_DEMOGRAPHICS } from "@utils/demographics";
import { useState } from "react";

export function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [demographicsChange, setDemographicsChange] = useState(ZEROED_CHANGEABLE_DEMOGRAPHICS);

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

      <SimulatorPanel
        simulatedChanges={demographicsChange}
        onSimulationChange={setDemographicsChange}
        labels={DEMOGRAPHICS_LABELS}
      />

      <MetricsComparisonSection
        location={selectedLocation}
        simulatedDemographicsChanges={demographicsChange}
      />
    </main>
  );
}
