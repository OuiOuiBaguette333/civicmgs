import { SA2_INFO_LINK } from "@data/abs";
import type { Location } from "@types";
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

async function loadLocationsOptions(input: string) {
  const normalisedInput = input.trim().toLowerCase();

  if (normalisedInput.length < 3) return [];

  const { default: vicSA2s } = await import("@data/abs/SA2_VIC.json");

  const filteredOptions = vicSA2s.map(({ label: group, options }) => {
    const filtered = options.filter(
      ({ label }) =>
        label.toLowerCase().includes(normalisedInput) ||
        group.toLowerCase().includes(normalisedInput),
    );
    return { label: group, options: filtered };
  });

  return filteredOptions;
}

function getNoOptionsMessage({ inputValue }: { inputValue: string }) {
  if (inputValue.length >= 3) return "No location found";
  return inputValue ? "Enter at least 3 characters" : "Enter a location...";
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

  option(baseStyles: CSSObjectWithLabel) {
    return {
      ...baseStyles,
      color: "#6b6375",
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

      <AsyncSelect<SelectValue>
        loadOptions={loadLocationsOptions}
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
    </section>
  );
}
