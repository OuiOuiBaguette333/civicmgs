/* eslint-disable no-await-in-loop -- the batches are deliberately sequential:
   this hits a public API 18 times and should do so one request at a time. */

// Fetches every Victorian SA2's figures once, so the map can colour 500-odd
// areas without 500 requests at page load.
//
//   npm run data:metrics
//
// The API cannot return every SA2 in one response — it times out — so codes are
// requested in batches, politely, and the result is bundled with the app.

import { writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

import vicSA2s from "../src/data/abs/SA2_VIC.json" with { type: "json" };

const API = "https://data.api.abs.gov.au/rest/data/ABS,ABS_REGIONAL_ASGS2021";
const YEAR = 2021;
const BATCH_SIZE = 30;
const PAUSE_MS = 300;
const OUTPUT = "../src/data/abs/SA2_VIC_metrics.json";

/** Kept in step with MEASURE_IDS in src/utils/fetchDemographics.ts. */
const MEASURES = {
  population: "ERP_P_20",
  medianAge: "ERP_23",
  medianEquivalisedHouseholdIncome: "EQUIV_2",
  unemploymentRate: "LF_4",
  rent: "RENT_4",
  bornOverseasCount: "TOTMIG_4",
  year12Completion: "HIGH_2",
  nonSchoolQualifications: "SCHOOL_2",
} as const;

type MeasureKey = keyof typeof MEASURES;

interface SdmxDimension {
  id: string;
  values: { id: string }[];
}

interface SdmxPayload {
  data?: {
    dataSets?: { observations?: Record<string, (number | string | null)[]> }[];
    structures?: { dimensions?: { observation?: SdmxDimension[] } }[];
  };
}

const codes = vicSA2s.flatMap(group => group.options.map(option => option.value));
const measureIds = Object.values(MEASURES).join("+");
const sleep = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

/** Reads a batch response, which carries one index per dimension per observation. */
function readBatch(payload: SdmxPayload) {
  const observations = payload.data?.dataSets?.[0]?.observations;
  const dimensions = payload.data?.structures?.[0]?.dimensions?.observation;

  if (!observations || !dimensions) return {};

  const positionOf = (id: string) => dimensions.findIndex(dimension => dimension.id === id);
  const measureAxis = positionOf("MEASURE");
  const regionAxis = dimensions.findIndex(
    dimension => /ASGS|REGION/u.test(dimension.id) && dimension.values.length > 1,
  );
  const raw: Record<string, Partial<Record<MeasureKey, number>>> = {};

  for (const [key, cells] of Object.entries(observations)) {
    const indexes = key.split(":").map(Number);
    const value = cells[0];

    if (typeof value !== "number") continue;

    const measureId = dimensions[measureAxis]?.values[indexes[measureAxis]]?.id;
    const regionId = dimensions[regionAxis]?.values[indexes[regionAxis]]?.id;

    if (!measureId || !regionId) continue;

    const name = (Object.keys(MEASURES) as MeasureKey[]).find(
      candidate => MEASURES[candidate] === measureId,
    );

    if (!name) continue;

    raw[regionId] ??= {};
    raw[regionId][name] = value;
  }

  return raw;
}

const areas: Record<string, Record<string, number>> = {};
let done = 0;

for (let index = 0; index < codes.length; index += BATCH_SIZE) {
  const batch = codes.slice(index, index + BATCH_SIZE);
  const url = `${API}/${measureIds}.SA2.${batch.join("+")}.A?dimensionAtObservation=AllDimensions&startPeriod=${YEAR}&endPeriod=${YEAR}&format=jsondata`;

  const response = await fetch(url);

  // 404 is how the API answers a batch with nothing published for it.
  if (response.status !== 404) {
    if (!response.ok) throw new Error(`ABS API responded ${response.status} for batch ${index}`);

    for (const [code, measures] of Object.entries(
      readBatch((await response.json()) as SdmxPayload),
    )) {
      const { bornOverseasCount, ...rest } = measures;
      const area: Record<string, number> = { ...rest };

      // A head count is not comparable between areas; a share is.
      if (bornOverseasCount !== undefined && rest.population) {
        area.bornOverseasShare = (bornOverseasCount / rest.population) * 100;
      }

      areas[code] = area;
    }
  }

  done += batch.length;
  process.stdout.write(`\r  ${done}/${codes.length} areas`);
  await sleep(PAUSE_MS);
}

const outputPath = resolvePath(import.meta.dirname, OUTPUT);
await writeFile(outputPath, JSON.stringify(areas));

console.log(
  `\n${Object.keys(areas).length} areas with figures, ` +
    `${(JSON.stringify(areas).length / 1024).toFixed(0)} kB -> ${outputPath}`,
);
