interface ScenarioSimulatorPanelProps {
  populationChange: number
  onPopulationChange: (value: number) => void
  educationFundingChange: number
  onEducationFundingChange: (value: number) => void
  infrastructureFundingChange: number
  onInfrastructureFundingChange: (value: number) => void
}

interface SliderRowProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function SliderRow({ label, value, onChange }: SliderRowProps) {
  return (
    <div className="scenario-slider-row">
      <div className="scenario-slider-row__top">
        <label>{label}</label>
        <span>{value}%</span>
      </div>
      <input
        type="range"
        min={-20}
        max={20}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

export function ScenarioSimulatorPanel({
  populationChange,
  onPopulationChange,
  educationFundingChange,
  onEducationFundingChange,
  infrastructureFundingChange,
  onInfrastructureFundingChange,
}: ScenarioSimulatorPanelProps) {
  return (
    <section className="scenario-panel">
      <h2>Scenario simulator</h2>
      <p>Adjust percentages to see immediate impact on suburb metrics.</p>

      <SliderRow
        label="Population change"
        value={populationChange}
        onChange={onPopulationChange}
      />
      <SliderRow
        label="Education funding change"
        value={educationFundingChange}
        onChange={onEducationFundingChange}
      />
      <SliderRow
        label="Infrastructure funding change"
        value={infrastructureFundingChange}
        onChange={onInfrastructureFundingChange}
      />
    </section>
  )
}
