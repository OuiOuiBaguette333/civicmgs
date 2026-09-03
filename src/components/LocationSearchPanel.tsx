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

// react-select paints its own light-mode colours, so every surface it draws has
// to be pointed back at the theme tokens or the whole control stays white in
// dark mode.
const selectStyles: StylesConfig<SelectValue> = {
  control: (baseStyles: CSSObjectWithLabel, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: "var(--surface)",
    borderColor: isFocused ? "var(--accent-border)" : "var(--border)",
    borderRadius: "8px",
    boxShadow: "none",
    padding: "6px 6px",
    "&:hover": { borderColor: "var(--accent-border)" },
  }),
  input: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text-h)" }),
  singleValue: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text-h)" }),
  placeholder: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
  menu: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  }),
  menuPortal: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, zIndex: 20 }),
  option: (baseStyles: CSSObjectWithLabel, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: isFocused ? "var(--accent-bg)" : "transparent",
    color: "var(--text-h)",
    "&:active": { backgroundColor: "var(--accent-bg)" },
  }),
  groupHeading: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
  noOptionsMessage: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
  loadingMessage: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
  indicatorSeparator: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    backgroundColor: "var(--border)",
  }),
  dropdownIndicator: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
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
        loadOptions={loadLocationOptions}
        noOptionsMessage={getNoOptionsMessage}
        blurInputOnSelect
        inputId="location-select"
        placeholder={null}
        // The control rail scrolls, which would otherwise clip the open menu.
        menuPortalTarget={globalThis.document?.body}
        styles={selectStyles}
        value={selectValue}
        onChange={newValue =>
          newValue && onSelectLocation({ code: newValue.value, name: newValue.label })
        }
      />
    </section>
  );
}
