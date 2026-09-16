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

const serif = { fontFamily: "var(--serif)", fontSize: "1.375rem", lineHeight: 1.2 };

// react-select paints its own boxed, light-mode control, so every surface it
// draws is pointed back at the theme: the field becomes a line to write on,
// like every other field on the page, and the menu takes the paper colour.
const selectStyles: StylesConfig<SelectValue> = {
  control: (baseStyles: CSSObjectWithLabel, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: "transparent",
    border: "0",
    borderBottom: `1px solid ${isFocused ? "var(--accent)" : "var(--border-strong)"}`,
    borderRadius: 0,
    // react-select suppresses the input's own outline, so focus is the line
    // turning to the accent and thickening.
    boxShadow: isFocused ? "0 1px 0 var(--accent)" : "none",
    cursor: "text",
    minHeight: 0,
    padding: "4px 0",
    transition: "border-color 130ms, box-shadow 130ms",
    "&:hover": { borderColor: "var(--accent)" },
  }),
  valueContainer: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, padding: "2px 0" }),
  input: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    ...serif,
    color: "var(--text-h)",
    margin: 0,
    padding: 0,
  }),
  singleValue: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    ...serif,
    color: "var(--text-h)",
    margin: 0,
  }),
  placeholder: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    ...serif,
    color: "var(--text-muted)",
    fontStyle: "italic",
    margin: 0,
  }),
  menu: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    backgroundColor: "var(--page)",
    border: "1px solid var(--border-strong)",
    borderRadius: 0,
    boxShadow: "none",
    marginTop: "4px",
  }),
  menuPortal: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, zIndex: 20 }),
  option: (baseStyles: CSSObjectWithLabel, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: isFocused ? "var(--accent-bg)" : "transparent",
    color: "var(--text-h)",
    fontSize: "var(--text-md)",
    "&:active": { backgroundColor: "var(--accent-bg)" },
  }),
  groupHeading: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    color: "var(--text-muted)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    letterSpacing: "0.12em",
  }),
  noOptionsMessage: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
  loadingMessage: (baseStyles: CSSObjectWithLabel) => ({ ...baseStyles, color: "var(--text)" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    color: "var(--text-h)",
    padding: "0 0 0 8px",
    "&:hover": { color: "var(--accent)" },
  }),
  clearIndicator: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    color: "var(--text-muted)",
    padding: "0 4px",
  }),
  loadingIndicator: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    color: "var(--text-muted)",
    padding: "0 4px",
  }),
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
    <section className="location-panel" aria-labelledby="location-title">
      <h2 className="caps" id="location-title">
        Suburb
      </h2>

      <label className="visually-hidden" htmlFor="location-select">
        Statistical Area Level 2
      </label>

      <AsyncSelect<SelectValue>
        loadOptions={loadLocationOptions}
        noOptionsMessage={getNoOptionsMessage}
        blurInputOnSelect
        inputId="location-select"
        placeholder="Search by name"
        // The control rail scrolls, which would otherwise clip the open menu.
        menuPortalTarget={globalThis.document?.body}
        styles={selectStyles}
        value={selectValue}
        onChange={newValue =>
          newValue && onSelectLocation({ code: newValue.value, name: newValue.label })
        }
      />

      <p className="location-panel__note">
        Search a{" "}
        <a href={SA2_INFO_LINK} target="_blank" rel="noreferrer">
          Statistical Area Level 2
        </a>{" "}
        in Victoria, which generally corresponds to a suburb.
      </p>
    </section>
  );
}
