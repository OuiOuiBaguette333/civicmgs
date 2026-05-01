// Creates SA2_AUS.json and SA2_VIC.json from SA2_AUS.csv
// (in src/data/abs)

import csv from "csvtojson";
import { writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

type SA2 = {
  "S/T code": string;
  "S/T name": string;
  "GCCSA code": string;
  "GCCSA name": string;
  "SA4 code": string;
  "SA4 name": string;
  "SA3 code": string;
  "SA3 name": string;
  "SA2 code": string;
  "SA2 name": string;
};

const writeJson = async (data: object, file: string) => {
  const json = JSON.stringify(data, null, 2);
  const outputPath = resolvePath(import.meta.dirname, file);
  await writeFile(outputPath, json);
};

const SA2_CSV = "../src/data/abs/SA2_AUS.csv";
const SA2_OUTPUT_AUS = "../src/data/abs/SA2_AUS.json";
const SA2_OUTPUT_VIC = "../src/data/abs/SA2_VIC.json";

const csvPath = resolvePath(import.meta.dirname, SA2_CSV);

const data: SA2[] = await csv().fromFile(csvPath);

const groupedByState = Object.groupBy(data, item => item["S/T name"]);
const groupedByStateEntries = Object.entries(groupedByState);

const groupedBySA4Entries = groupedByStateEntries.map(([state, items]) => [state, Object.groupBy(items!, item => item["SA4 name"])]);

const formattedEntries = groupedBySA4Entries.map(([state, value]) => {
  return [
    state,
    Object.fromEntries(
      Object.entries(value).map(([SA4, SA2s]) => [SA4, (SA2s as SA2[]).map(SA2 => ({ label: SA2["SA2 name"], value: SA2["SA2 code"] }))])
  )];
});

const aus = Object.fromEntries(formattedEntries);
const vic = Object.entries(aus["Victoria"]).map(([SA4, SA2s]) => ({ label: SA4, options: SA2s }));

await writeJson(aus, SA2_OUTPUT_AUS);
await writeJson(vic, SA2_OUTPUT_VIC);
