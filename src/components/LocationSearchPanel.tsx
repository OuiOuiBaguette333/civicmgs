import { SA2_INFO_LINK } from "@data/abs";
import type { Location } from "@types";
import debounceAsync from "@utils/debounceAsync";
import type { CSSObjectWithLabel, StylesConfig } from "react-select";
import AsyncSelect from "react-select/async";

interface LocationSearchPanelProps {
  selectedLocation?: Location;
  onSelectLocation: (location: Location) => void;
}

interface SelectValue {
  label: string;
  value: string;
}

interface LocationGroup {
  label: string;
  options: SelectValue[];
}

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 200;

async function searchLocations(input: string): Promise<LocationGroup[]> {
  const query = input.trim().toLowerCase();

  if (query.length < MIN_QUERY_LENGTH) return [];

  const { default: vicSA2s } = await import("@data/abs/SA2_VIC.json");

  return (
    vicSA2s
      .map(({ label: group, options }) => ({
        label: group,
        options: options.filter(
          ({ label }) => label.toLowerCase().includes(query) || group.toLowerCase().includes(query),
        ),
      }))
      // react-select still draws a heading for a group with nothing under it.
      .filter(group => group.options.length > 0)
  );
}

// Every keystroke otherwise walks all ~500 Victorian SA2s.
const loadLocationOptions = debounceAsync(searchLocations, SEARCH_DEBOUNCE_MS);

function getNoOptionsMessage({ inputValue }: { inputValue: string }) {
  if (inputValue.length >= MIN_QUERY_LENGTH) return "No location found";

  return inputValue ? `Enter at least ${MIN_QUERY_LENGTH} characters` : "Enter a location...";
}

const selectStyles: StylesConfig<SelectValue> = {
  control(baseStyles: CSSObjectWithLabel) {
    return {
      ...baseStyles,
      borderColor: "var(--border)",
      borderRadius: "8px",
      padding: "6px 6px",
    };
  },
};

export function LocationSearchPanel({
  selectedLocation,
  onSelectLocation,
}: LocationSearchPanelProps) {
  const selectValue: SelectValue | undefined = selectedLocation && {
    label: selectedLocation.name,
    value: selectedLocation.code,
  };

  return (
    <section className="location-panel">
      <h2>Suburb input</h2>

      <p>
        Search for a{" "}
        <a href={SA2_INFO_LINK} target="_blank" rel="noreferrer">
          Statistical Area Level 2 (ABS)
        </a>{" "}
        in Victoria, which generally corresponds to a suburb.
      </p>

      <label className="location-panel__label" htmlFor="location-select">
        Statistical Area Level 2
      </label>

      <div className="location-panel__select">
        <AsyncSelect<SelectValue>
          loadOptions={loadLocationOptions}
          noOptionsMessage={getNoOptionsMessage}
          blurInputOnSelect
          inputId="location-select"
          placeholder={null}
          styles={selectStyles}
          value={selectValue}
          onChange={newValue =>
            newValue && onSelectLocation({ code: newValue.value, name: newValue.label })
          }
        />
      </div>
    </section>
  );
}
