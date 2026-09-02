import { ABS_DATAFLOW, REGION_TYPES, VICTORIA_CODE, YEAR } from "@data/abs";
import type { PartialDemographics } from "@utils/demographics";

const API_BASE_URL = "https://data.api.abs.gov.au/rest/data";

/** Dimension holding the measure being reported, within an observation key. */
const MEASURE_DIMENSION_ID = "MEASURE";

/** ABS_REGIONAL_ASGS2021 measure ids, keyed by what they mean to this app. */
export const MEASURE_IDS = {
  population: "ERP_P_20",
  medianAge: "ERP_23",
  medianEquivalisedHouseholdIncome: "EQUIV_2",
  unemploymentRate: "LF_4",
  rent: "RENT_4",
  bornOverseasCount: "TOTMIG_4",
  year12Completion: "HIGH_2",
  nonSchoolQualifications: "SCHOOL_2",
} as const;

export type MeasureKey = keyof typeof MEASURE_IDS;

/** Measures exactly as the API reports them, before any derivation. */
export type RawMeasures = Partial<Record<MeasureKey, number>>;

interface SdmxDimension {
  id: string;
  values: { id: string }[];
}

export interface SdmxPayload {
  data?: {
    dataSets?: { observations?: Record<string, (number | string | null)[]> }[];
    structures?: { dimensions?: { observation?: SdmxDimension[] } }[];
  };
}

export class AbsApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AbsApiError";
  }
}

/**
 * With dimensionAtObservation=AllDimensions an observation is keyed by one index
 * per dimension, in the order the response lists them. Every dimension except
 * MEASURE is pinned to a single value by the query, so those indexes are always
 * zero — but the number and order of dimensions is read from the response rather
 * than assumed, since a hardcoded key silently returns the wrong measure if the
 * dataflow ever gains a dimension.
 */
export function buildObservationKey(dimensions: SdmxDimension[], measureId: string) {
  if (dimensions.length === 0) return null;

  const indexes = dimensions.map(dimension =>
    dimension.id === MEASURE_DIMENSION_ID
      ? dimension.values.findIndex(value => value.id === measureId)
      : 0,
  );

  return indexes.includes(-1) ? null : indexes.join(":");
}

export function readMeasures(payload: SdmxPayload): RawMeasures {
  const observations = payload.data?.dataSets?.[0]?.observations;
  const dimensions = payload.data?.structures?.[0]?.dimensions?.observation;

  if (!observations || !dimensions) {
    throw new AbsApiError("The ABS data API returned a response in an unexpected shape.");
  }

  const measures: RawMeasures = {};

  for (const key of Object.keys(MEASURE_IDS) as MeasureKey[]) {
    const observationKey = buildObservationKey(dimensions, MEASURE_IDS[key]);

    // Absent from the response, or present but suppressed for this area.
    if (observationKey === null) continue;

    const [value] = observations[observationKey] ?? [];

    if (typeof value === "number") measures[key] = value;
  }

  return measures;
}

export function deriveDemographics({
  bornOverseasCount,
  ...measures
}: RawMeasures): PartialDemographics {
  const demographics: PartialDemographics = { ...measures };

  // A head count cannot be compared between areas of different sizes; a share can.
  if (bornOverseasCount !== undefined && measures.population) {
    demographics.bornOverseasShare = (bornOverseasCount / measures.population) * 100;
  }

  return demographics;
}

const cache = new Map<string, PartialDemographics>();

async function fetchRegion(regionType: string, regionCode: string, signal?: AbortSignal) {
  const cacheKey = `${regionType}.${regionCode}`;
  const cached = cache.get(cacheKey);

  if (cached) return cached;

  const searchParams = new URLSearchParams({
    dimensionAtObservation: "AllDimensions",
    startPeriod: YEAR.toString(),
    endPeriod: YEAR.toString(),
    format: "jsondata",
  });

  const measures = Object.values(MEASURE_IDS).join("+");
  const url = `${API_BASE_URL}/${ABS_DATAFLOW}/${measures}.${regionType}.${regionCode}.A?${searchParams}`;

  let response: Response;

  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AbsApiError("Could not reach the ABS data API. Check your connection.", {
      cause: error,
    });
  }

  // The API answers an empty result set with 404, which is a legitimate outcome
  // for an area whose every measure is suppressed rather than a failure.
  if (response.status === 404) {
    cache.set(cacheKey, {});
    return {};
  }

  if (!response.ok) {
    throw new AbsApiError(
      `The ABS data API responded with ${response.status} ${response.statusText}.`,
    );
  }

  let payload: SdmxPayload;

  try {
    payload = (await response.json()) as SdmxPayload;
  } catch (error) {
    throw new AbsApiError("The ABS data API returned a response that could not be read.", {
      cause: error,
    });
  }

  const demographics = deriveDemographics(readMeasures(payload));
  cache.set(cacheKey, demographics);

  return demographics;
}

export const fetchAreaDemographics = (sa2Code: string, signal?: AbortSignal) =>
  fetchRegion(REGION_TYPES.sa2, sa2Code, signal);

export const fetchVictorianDemographics = (signal?: AbortSignal) =>
  fetchRegion(REGION_TYPES.state, VICTORIA_CODE, signal);
