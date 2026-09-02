import { LocationSearchPanel } from "@components/LocationSearchPanel";
import { MetricsComparisonSection } from "@components/MetricsComparisonSection";
import { SimulatorPanel } from "@components/SimulatorPanel";
import type { Location } from "@types";
import { DEMOGRAPHICS_LABELS, NO_SIMULATED_CHANGES } from "@utils/demographics";
import { useState } from "react";

export function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [simulatedChanges, setSimulatedChanges] = useState(NO_SIMULATED_CHANGES);

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <p className="dashboard-page__eyebrow">CivicLens MVP</p>
        <h1>Victorian suburb snapshot</h1>
        <p>
          Sliders currently scale a metric by itself. Nothing here models one metric affecting
          another, so a change should not be read as a prediction.
        </p>
      </header>

      <LocationSearchPanel
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
      />

      <SimulatorPanel
        simulatedChanges={simulatedChanges}
        onSimulationChange={setSimulatedChanges}
        labels={DEMOGRAPHICS_LABELS}
      />

      <MetricsComparisonSection location={selectedLocation} simulatedChanges={simulatedChanges} />
    </main>
  );
}
