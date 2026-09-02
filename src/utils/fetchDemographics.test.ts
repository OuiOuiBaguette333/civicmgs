import {
  AbsApiError,
  buildObservationKey,
  deriveDemographics,
  readMeasures,
  type SdmxPayload,
} from "@utils/fetchDemographics";
import { describe, expect, it } from "vitest";

/**
 * Alfredton (SA2 201011001) for 2021, trimmed to the fields the parser reads.
 * The measures are deliberately in the order the API actually returns them,
 * which is not the order the app declares them in.
 */
const ALFREDTON: SdmxPayload = {
  data: {
    dataSets: [
      {
        observations: {
          "0:0:0:0:0": [2640, 0, null, null, null],
          "1:0:0:0:0": [63.2, 1, null, null, null],
          "2:0:0:0:0": [61.4, 1, null, null, null],
          "3:0:0:0:0": [3.7, 1, null, null, null],
          "4:0:0:0:0": [16_841, 2, null, null, null],
          "5:0:0:0:0": [370, 3, null, null, null],
          "6:0:0:0:0": [1113, 3, null, null, null],
          "7:0:0:0:0": [34.2, 4, null, null, null],
        },
      },
    ],
    structures: [
      {
        dimensions: {
          observation: [
            {
              id: "MEASURE",
              values: [
                { id: "TOTMIG_4" },
                { id: "SCHOOL_2" },
                { id: "HIGH_2" },
                { id: "LF_4" },
                { id: "ERP_P_20" },
                { id: "RENT_4" },
                { id: "EQUIV_2" },
                { id: "ERP_23" },
              ],
            },
            { id: "REGIONTYPE", values: [{ id: "SA2" }] },
            { id: "ASGS_2021", values: [{ id: "201011001" }] },
            { id: "FREQUENCY", values: [{ id: "A" }] },
            { id: "TIME_PERIOD", values: [{ id: "2021" }] },
          ],
        },
      },
    ],
  },
};

describe("buildObservationKey", () => {
  const dimensions = ALFREDTON.data!.structures![0].dimensions!.observation!;

  it("locates a measure by id rather than by position", () => {
    expect(buildObservationKey(dimensions, "TOTMIG_4")).toBe("0:0:0:0:0");
    expect(buildObservationKey(dimensions, "ERP_23")).toBe("7:0:0:0:0");
  });

  it("returns null for a measure the response does not carry", () => {
    expect(buildObservationKey(dimensions, "NOT_A_MEASURE")).toBeNull();
  });

  it("follows the dimension count and order in the response", () => {
    const reordered = [
      { id: "TIME_PERIOD", values: [{ id: "2021" }] },
      { id: "MEASURE", values: [{ id: "LF_4" }, { id: "ERP_23" }] },
    ];

    expect(buildObservationKey(reordered, "ERP_23")).toBe("0:1");
  });

  it("returns null when there are no dimensions", () => {
    expect(buildObservationKey([], "LF_4")).toBeNull();
  });
});

describe("readMeasures", () => {
  it("reads every measure the response carries", () => {
    expect(readMeasures(ALFREDTON)).toStrictEqual({
      bornOverseasCount: 2640,
      nonSchoolQualifications: 63.2,
      year12Completion: 61.4,
      unemploymentRate: 3.7,
      population: 16_841,
      rent: 370,
      medianEquivalisedHouseholdIncome: 1113,
      medianAge: 34.2,
    });
  });

  it("omits a measure the ABS has suppressed for the area", () => {
    const suppressed: SdmxPayload = {
      data: {
        ...ALFREDTON.data,
        dataSets: [{ observations: { "4:0:0:0:0": [16_841, 2, null, null, null] } }],
      },
    };

    expect(readMeasures(suppressed)).toStrictEqual({ population: 16_841 });
  });

  it("ignores a non-numeric observation rather than passing it on", () => {
    const blank: SdmxPayload = {
      data: {
        ...ALFREDTON.data,
        dataSets: [{ observations: { "3:0:0:0:0": [null, 1, null, null, null] } }],
      },
    };

    expect(readMeasures(blank)).toStrictEqual({});
  });

  it("throws rather than guessing when the response has an unexpected shape", () => {
    expect(() => readMeasures({})).toThrow(AbsApiError);
    expect(() => readMeasures({ data: { dataSets: [{ observations: {} }] } })).toThrow(AbsApiError);
  });
});

describe("deriveDemographics", () => {
  it("turns the born-overseas head count into a share of the population", () => {
    const { bornOverseasShare } = deriveDemographics({
      bornOverseasCount: 2640,
      population: 16_841,
    });

    expect(bornOverseasShare).toBeCloseTo(15.68, 2);
  });

  it("passes every other measure through untouched", () => {
    expect(deriveDemographics({ unemploymentRate: 3.7, rent: 370 })).toStrictEqual({
      unemploymentRate: 3.7,
      rent: 370,
    });
  });

  it("omits the share when there is nothing to divide by", () => {
    expect(deriveDemographics({ bornOverseasCount: 2640 })).toStrictEqual({});
    expect(deriveDemographics({ bornOverseasCount: 0, population: 0 })).toStrictEqual({
      population: 0,
    });
  });
});
