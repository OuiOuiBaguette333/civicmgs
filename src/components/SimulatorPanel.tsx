interface SimulatorPanelProps<T extends Record<string, number>> {
  simulatedChanges: T
  onSimulationChange: (value: T) => void
  labels: Record<keyof T, string>
}

interface SliderRowProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function SliderRow({ label, value, onChange }: SliderRowProps) {
  const id = `slider-${label.toLowerCase()}`

  return (
    <div className="scenario-slider-row">
      <div className="scenario-slider-row__top">
        <label htmlFor={id}>{label} change</label>
        <span>{value}%</span>
      </div>

      <input
        type="range"
        min={-20}
        max={20}
        step={1}
        value={value}
        id={id}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

export function SimulatorPanel<T extends Record<string, number>>({
  simulatedChanges,
  onSimulationChange,
  labels,
}: SimulatorPanelProps<T>) {
  const handleChange = (metric: string, newValue: number) => {
    onSimulationChange({
      ...simulatedChanges,
      [metric]: newValue
    })
  }

  return (
    <section className="scenario-panel">
      <h2>Scenario simulator</h2>
      <p>Adjust percentages to see immediate impact on suburb metrics.</p>

      {
        Object.entries(simulatedChanges).map(([metric, value]) => {
          return (
            <SliderRow
              key={metric}
              label={labels[metric]}
              value={value}
              onChange={newValue => handleChange(metric, newValue)}
            />
          )
        })
      }
    </section>
  )
}
