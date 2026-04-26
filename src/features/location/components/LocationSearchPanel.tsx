import locationsData from '../../../data/mock/locations.vic.json'
import type { LocationRecord } from '../../../types'

interface LocationSearchPanelProps {
  selectedLocationId: string
  onSelectLocation: (locationId: string) => void
}

export function LocationSearchPanel({
  selectedLocationId,
  onSelectLocation,
}: LocationSearchPanelProps) {
  const locations = locationsData as LocationRecord[]

  return (
    <section className="location-panel">
      <h2>Suburb input</h2>
      <p>Select a Melbourne/Victoria suburb from the mock dataset.</p>
      <label className="location-panel__label" htmlFor="location-select">
        Suburb or postcode
      </label>
      <select
        id="location-select"
        className="location-panel__select"
        value={selectedLocationId}
        onChange={(event) => onSelectLocation(event.target.value)}
      >
        {locations.map((location) => (
          <option key={location.locationId} value={location.locationId}>
            {location.suburbName} ({location.postcode})
          </option>
        ))}
      </select>
    </section>
  )
}
