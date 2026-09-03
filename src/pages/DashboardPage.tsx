import { LocationSearchPanel } from "@components/LocationSearchPanel";
import { MetricsComparisonSection } from "@components/MetricsComparisonSection";
import { PolicyScenarioPanel } from "@components/PolicyScenarioPanel";
import { SimulatorPanel } from "@components/SimulatorPanel";
import { NO_LEVER_CHANGES } from "@model/levers";
import { DEFAULT_HORIZON } from "@model/project";
import type { Location } from "@types";
import { DEMOGRAPHICS_LABELS, NO_SIMULATED_CHANGES } from "@utils/demographics";
import { useState } from "react";

export function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [simulatedChanges, setSimulatedChanges] = useState(NO_SIMULATED_CHANGES);
  const [leverChanges, setLeverChanges] = useState(NO_LEVER_CHANGES);
  const [horizonYears, setHorizonYears] = useState<number>(DEFAULT_HORIZON);

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <p className="dashboard-page__eyebrow">CivicLens MVP</p>
        <h1>Victorian suburb snapshot</h1>
        <p>
          Move a policy lever and CivicLens projects it onto the census figures for this suburb
          using published research, as a range with its working shown. Where no research supports a
          link, it says so instead of inventing a number.
        </p>
      </header>

      <div className="dashboard-page__controls">
        <LocationSearchPanel
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />

        <PolicyScenarioPanel
          leverChanges={leverChanges}
          onLeverChange={setLeverChanges}
          horizonYears={horizonYears}
          onHorizonChange={setHorizonYears}
          onReset={() => setLeverChanges(NO_LEVER_CHANGES)}
        />

        <SimulatorPanel
          simulatedChanges={simulatedChanges}
          onSimulationChange={setSimulatedChanges}
          onReset={() => setSimulatedChanges(NO_SIMULATED_CHANGES)}
          labels={DEMOGRAPHICS_LABELS}
        />
      </div>

      <div className="dashboard-page__results">
        <MetricsComparisonSection
          location={selectedLocation}
          simulatedChanges={simulatedChanges}
          leverChanges={leverChanges}
          horizonYears={horizonYears}
        />
      </div>
    </main>
  );
}
