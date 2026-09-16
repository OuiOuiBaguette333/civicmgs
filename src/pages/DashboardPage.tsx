import { ChoroplethMap } from "@components/ChoroplethMap";
import { LocationSearchPanel } from "@components/LocationSearchPanel";
import { Colophon, Masthead } from "@components/Masthead";
import { MetricsComparisonSection } from "@components/MetricsComparisonSection";
import { PolicyScenarioPanel } from "@components/PolicyScenarioPanel";
import { SimulatorPanel } from "@components/SimulatorPanel";
import { YEAR } from "@data/abs";
import { useDistrictOf } from "@hooks/useDistrictOf";
import type { Scenario } from "@hooks/useScenario";
import { useToday } from "@hooks/useToday";
import type { Location } from "@types";
import { type Demographic, DEMOGRAPHICS_LABELS, NO_SIMULATED_CHANGES } from "@utils/demographics";
import { useState } from "react";

interface DashboardPageProps {
  scenario: Scenario;
  onBack: () => void;
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button className="link-button dashboard-page__back caps" onClick={onBack} type="button">
      <svg
        className="dashboard-page__back-arrow"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M13 8H3M7 4 3 8l4 4" />
      </svg>
      Districts and election dates
    </button>
  );
}

/** The suburb as the title, with the district it sits in underneath. */
function Title({ location }: { location?: Location }) {
  const district = useDistrictOf(location?.code);

  const where = location
    ? [district && `${district.name} district`, district?.region, "Statistical Area Level 2"]
        .filter(Boolean)
        .join(" · ")
    : "Search below, or choose an area on the map.";

  return (
    <div className="dashboard-page__name">
      <p className="caps">Victorian suburb snapshot</p>
      <h1 tabIndex={-1}>{location?.name ?? "Choose a suburb"}</h1>
      <p className="dashboard-page__where">{where}</p>
    </div>
  );
}

export function DashboardPage({ scenario, onBack }: DashboardPageProps) {
  const [simulatedChanges, setSimulatedChanges] = useState(NO_SIMULATED_CHANGES);
  const [mapMetric, setMapMetric] = useState<Demographic>("year12Completion");
  const now = useToday();

  return (
    <main className="dashboard-page">
      <Masthead now={now} />

      <header className="dashboard-page__header">
        <BackLink onBack={onBack} />

        <div className="dashboard-page__title">
          <Title location={scenario.location} />

          <p className="dashboard-page__standfirst">
            Move a policy lever and CivicLens projects it onto the census figures for this suburb
            using published research, as a range with its working shown. Where no research supports
            a link, it says so instead of inventing a number.
          </p>
        </div>
      </header>

      <div className="dashboard-page__body">
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
            onReset={scenario.reset}
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
      </div>

      <Colophon
        sources={`ABS ${YEAR} census, regional dataset · Studies cited beside each projection`}
      />
    </main>
  );
}
