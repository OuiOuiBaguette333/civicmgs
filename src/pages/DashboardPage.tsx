import { ChoroplethMap } from "@components/ChoroplethMap";
import { LocationSearchPanel } from "@components/LocationSearchPanel";
import { MetricsComparisonSection } from "@components/MetricsComparisonSection";
import { PolicyScenarioPanel } from "@components/PolicyScenarioPanel";
import { SimulatorPanel } from "@components/SimulatorPanel";
import { useScenario } from "@hooks/useScenario";
import { type Demographic, DEMOGRAPHICS_LABELS, NO_SIMULATED_CHANGES } from "@utils/demographics";
import { useState } from "react";

export function DashboardPage() {
  const scenario = useScenario();
  const [simulatedChanges, setSimulatedChanges] = useState(NO_SIMULATED_CHANGES);
  const [mapMetric, setMapMetric] = useState<Demographic>("year12Completion");

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
          selectedLocation={scenario.location}
          onSelectLocation={scenario.setLocation}
        />

        <PolicyScenarioPanel
          leverChanges={scenario.levers}
          onLeverChange={scenario.setLevers}
          horizonYears={scenario.horizonYears}
          onHorizonChange={scenario.setHorizonYears}
          commitmentYears={scenario.commitmentYears}
          onCommitmentYearsChange={scenario.setCommitmentYears}
          onReset={scenario.resetLevers}
        />

        <SimulatorPanel
          simulatedChanges={simulatedChanges}
          onSimulationChange={setSimulatedChanges}
          onReset={() => setSimulatedChanges(NO_SIMULATED_CHANGES)}
          labels={DEMOGRAPHICS_LABELS}
        />
      </div>

      <div className="dashboard-page__results">
        <ChoroplethMap
          metric={mapMetric}
          onMetricChange={setMapMetric}
          selectedCode={scenario.location?.code}
          onSelect={scenario.setLocation}
        />

        <MetricsComparisonSection
          location={scenario.location}
          simulatedChanges={simulatedChanges}
          leverChanges={scenario.levers}
          horizonYears={scenario.horizonYears}
        />
      </div>
    </main>
  );
}
