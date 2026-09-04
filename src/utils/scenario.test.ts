import { DEFAULT_COMMITMENT_YEARS } from "@model/cost";
import { LEVER_MAX, LEVER_MIN, NO_LEVER_CHANGES } from "@model/levers";
import { DEFAULT_HORIZON } from "@model/project";
import { decodeScenario, EMPTY_SCENARIO, encodeScenario, type Scenario } from "@utils/scenario";
import { describe, expect, it } from "vitest";

const scenario = (overrides: Partial<Scenario> = {}): Scenario => ({
  ...EMPTY_SCENARIO,
  ...overrides,
});

describe("encodeScenario", () => {
  it("writes nothing for an untouched scenario", () => {
    expect(encodeScenario(EMPTY_SCENARIO)).toBe("");
  });

  it("carries only what was changed", () => {
    const query = encodeScenario(
      scenario({ sa2: "201011001", levers: { ...NO_LEVER_CHANGES, schoolFunding: 20 } }),
    );

    expect(query).toBe("sa2=201011001&schoolFunding=20");
  });

  it("includes the horizon and commitment period only when they differ from the default", () => {
    expect(encodeScenario(scenario({ horizonYears: 50, commitmentYears: 10 }))).toBe(
      "years=50&over=10",
    );
  });

  it("trims a lever derived from dollars to a shareable precision", () => {
    const query = encodeScenario(
      scenario({ levers: { ...NO_LEVER_CHANGES, schoolFunding: 4.210056448377218 } }),
    );

    expect(query).toBe("schoolFunding=4.21");
  });

  it("refuses to write a malformed area code", () => {
    expect(encodeScenario(scenario({ sa2: "not-a-code" }))).toBe("");
  });
});

describe("decodeScenario", () => {
  it("round-trips a scenario", () => {
    const original = scenario({
      sa2: "201011001",
      levers: { ...NO_LEVER_CHANGES, schoolFunding: 12.5, housingSupply: -8 },
      horizonYears: 30,
      commitmentYears: 2,
    });

    expect(decodeScenario(encodeScenario(original))).toStrictEqual(original);
  });

  it("falls back to defaults for an empty query", () => {
    expect(decodeScenario("")).toStrictEqual(EMPTY_SCENARIO);
  });

  it("drops an area code that is not nine digits", () => {
    expect(decodeScenario("sa2=../etc/passwd").sa2).toBeUndefined();
    expect(decodeScenario("sa2=20101100").sa2).toBeUndefined();
    expect(decodeScenario("sa2=201011001").sa2).toBe("201011001");
  });

  it("clamps a lever pushed past its range", () => {
    expect(decodeScenario("schoolFunding=99999").levers.schoolFunding).toBe(LEVER_MAX);
    expect(decodeScenario("schoolFunding=-99999").levers.schoolFunding).toBe(LEVER_MIN);
  });

  it("ignores a lever that is not a number", () => {
    expect(decodeScenario("schoolFunding=Infinity").levers.schoolFunding).toBe(0);
    expect(decodeScenario("schoolFunding=banana").levers.schoolFunding).toBe(0);
    expect(decodeScenario("schoolFunding=").levers.schoolFunding).toBe(0);
  });

  it("ignores a horizon or period the model does not offer", () => {
    expect(decodeScenario("years=17").horizonYears).toBe(DEFAULT_HORIZON);
    expect(decodeScenario("years=50").horizonYears).toBe(50);
    expect(decodeScenario("over=7").commitmentYears).toBe(DEFAULT_COMMITMENT_YEARS);
    expect(decodeScenario("over=10").commitmentYears).toBe(10);
  });

  it("ignores parameters it does not know", () => {
    expect(decodeScenario("sa2=201011001&admin=true&__proto__=x").levers).toStrictEqual(
      NO_LEVER_CHANGES,
    );
  });
});
