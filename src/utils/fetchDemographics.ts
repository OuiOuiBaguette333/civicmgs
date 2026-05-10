import { YEAR } from "@data/abs";
import { type Demographic, type Demographics, DEMOGRAPHICS } from "@utils/demographics";

type ApiResponse = {
  meta: object;
  data: {
    dataSets: {
      structure: number;
      action: string;
      links: object[];
      annotations: number[];
      observations: Record<string, [number, number, null, null, null]>;
    }[];
    structures: [
      {
        name: string;
        names: Record<string, string>;
        description: string;
        descriptions: Record<string, string>;
        dimensions: {
          dataSet: [];
          series: [];
          observation: {
            id: string;
            name: string;
            names: Record<string, string>;
            keyPosition: number;
            roles: string[];
            values: {
              id: string;
              order: number;
              name: string;
              names: Record<string, string>;
              parent?: string;
              parents?: string[];
              annotations: number[];
            }[];
          }[];
        };
        attributes: object;
        annotations: object[];
        dataSets: number[];
      },
    ];
  };
  errors: [];
};

const API_BASE_URL = "https://data.api.abs.gov.au/rest/data/ABS,ABS_REGIONAL_ASGS2021,";

const API_IDS: Record<Demographic, string> = {
  population: "ERP_P_20",
  medianAge: "ERP_23",
  medianWeeklyHouseholdIncome: "EQUIV_2",
  unemploymentRate: "LF_4",
  rent: "RENT_4",
  personsBornOverseas: "TOTMIG_4",
  year12Completion: "HIGH_2",
  nonSchoolQualifications: "SCHOOL_2",
};

export default async (locationCode: string): Promise<Demographics> => {
  const apiSearchParams = new URLSearchParams({
    dimensionAtObservation: "AllDimensions",
    startPeriod: YEAR.toString(),
    endPeriod: YEAR.toString(),
    format: "jsondata",
  });

  const ids = Object.values(API_IDS).join("+");

  const apiUrl = `${API_BASE_URL}/${ids}.SA2.${locationCode}.A?${apiSearchParams}`;

  const apiResponse = await fetch(apiUrl);
  const apiData: ApiResponse = await apiResponse.json();

  const measures = apiData.data.structures[0].dimensions.observation[0].values;
  const observations = apiData.data.dataSets[0].observations;

  const demographicsEntries = DEMOGRAPHICS.map<[Demographic, number]>(demographic => {
    const measureIndex = measures.findIndex(({ id }) => id === API_IDS[demographic]);
    const observationKey = `${measureIndex}:0:0:0:0`;
    const [value] = observations[observationKey];
    return [demographic, value];
  });

  return Object.fromEntries(demographicsEntries) as Record<Demographic, number>;
};
