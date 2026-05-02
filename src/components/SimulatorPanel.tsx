import { clamp } from '@utils'
import { useState, type ChangeEvent, type FocusEvent } from 'react'

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

const MIN = -20
const MAX = 20
const STEP = 0.1

function SliderRow({ label, value, onChange }: SliderRowProps) {
  const [tempValue, setTempValue] = useState<number | "">(value)

  const handleBoxChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) {
      setTempValue("")
      return
    }

    const newValue = event.target.valueAsNumber

    setTempValue(newValue)

    if (newValue >= MIN && newValue <= MAX) {
      onChange(newValue)
    }
  }

  const handleBoxBlur = (event: FocusEvent<HTMLInputElement>) => {
    const newValue = event.target.valueAsNumber
    const correctedValue = Number.isNaN(newValue) ? 0 : Math.round(clamp(newValue, MIN, MAX) * 10) / 10

    setTempValue(correctedValue)
    onChange(correctedValue)
  }

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.valueAsNumber
    setTempValue(newValue)
    onChange(newValue)
  }

  return (
    <fieldset className="scenario-slider-row">
      <div className="scenario-slider-row__top">
        <legend>{label} change</legend>

        <div>
          <input
            type="number"
            min={MIN}
            max={MAX}
            step={STEP}
            value={tempValue}
            id={`box-${label.toLowerCase()}`}
            onChange={handleBoxChange}
            onBlur={handleBoxBlur}
          />

          <span>%</span>
        </div>
      </div>

      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={value}
        id={`slider-${label.toLowerCase()}`}
        onChange={handleSliderChange}
      />
    </fieldset>
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
      [metric]: Number.isNaN(newValue) ? 0 : newValue
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
