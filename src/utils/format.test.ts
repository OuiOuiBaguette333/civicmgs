import formatValue, { createDelta } from "@utils/format";
import { describe, expect, it } from "vitest";

describe("formatValue", () => {
  it("rounds counts and currency for display", () => {
    expect(formatValue(16_841.4, "count")).toBe("16,841");
    expect(formatValue(1113.6, "currency")).toBe("$1,114");
  });

  it("keeps one decimal place on rates and ages", () => {
    expect(formatValue(3.72, "percent")).toBe("3.7%");
    expect(formatValue(34.2, "years")).toBe("34.2 years");
  });

  it("measures a difference between percentages in percentage points", () => {
    expect(formatValue(1.3, "percent", true)).toBe("1.3 pp");
  });
});

describe("createDelta", () => {
  const percent = { format: "percent", direction: "higher" } as const;

  it("describes the size and direction of the gap", () => {
    expect(createDelta(61.4, 61.8, percent).label).toBe("0.4 pp below Victoria");
    expect(createDelta(63.2, 61.8, percent).label).toBe("1.4 pp above Victoria");
  });

  it("calls two figures the same when they display the same", () => {
    // An exact float comparison would report a difference of 0.0 pp here.
    expect(createDelta(61.82, 61.8, percent)).toStrictEqual({
      label: "Same as Victoria",
      tone: "neutral",
    });
  });

  it("reads the tone from the direction that counts as an improvement", () => {
    expect(createDelta(61.4, 61.8, percent).tone).toBe("negative");
    expect(createDelta(63.2, 61.8, percent).tone).toBe("positive");

    const unemployment = { format: "percent", direction: "lower" } as const;

    expect(createDelta(3.7, 5, unemployment).tone).toBe("positive");
    expect(createDelta(6.3, 5, unemployment).tone).toBe("negative");
  });

  it("takes no side where neither direction is an improvement", () => {
    const age = { format: "years", direction: "neutral" } as const;

    expect(createDelta(34.2, 37.9, age)).toStrictEqual({
      label: "3.7 years below Victoria",
      tone: "neutral",
    });
  });
});
