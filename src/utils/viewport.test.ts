import {
  clampViewport,
  formatViewBox,
  MAX_ZOOM,
  panBy,
  parseViewBox,
  pointerToMap,
  type Viewport,
  zoomAt,
  zoomOf,
} from "@utils/viewport";
import { describe, expect, it } from "vitest";

const base: Viewport = { x: 0, y: 0, width: 800, height: 560 };

describe("parseViewBox", () => {
  it("reads the four numbers of a viewBox", () => {
    expect(parseViewBox("0 0 800 560")).toStrictEqual(base);
    expect(parseViewBox("  10  20   30 40 ")).toStrictEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it("round-trips through the formatter", () => {
    expect(parseViewBox(formatViewBox(base))).toStrictEqual(base);
  });
});

describe("clampViewport", () => {
  it("refuses to zoom out past the whole state", () => {
    expect(clampViewport({ x: -500, y: -500, width: 4000, height: 2800 }, base)).toStrictEqual(
      base,
    );
  });

  it("refuses to zoom in past the limit", () => {
    const tiny = clampViewport({ x: 0, y: 0, width: 0.001, height: 0.001 }, base);

    expect(tiny.width).toBeCloseTo(base.width / MAX_ZOOM, 6);
  });

  it("keeps the view inside the extent", () => {
    const view = clampViewport({ x: 700, y: 500, width: 400, height: 280 }, base);

    expect(view.x).toBe(400);
    expect(view.y).toBe(280);
  });

  it("holds the aspect ratio of the state", () => {
    const view = clampViewport({ x: 0, y: 0, width: 400, height: 999 }, base);

    expect(view.height / view.width).toBeCloseTo(base.height / base.width, 10);
  });
});

describe("zoomAt", () => {
  it("keeps the point under the pointer fixed", () => {
    const point = { x: 600, y: 400 };
    const zoomed = zoomAt(base, base, 2, point);

    // The point should sit at the same fraction across the view as before.
    expect((point.x - zoomed.x) / zoomed.width).toBeCloseTo((point.x - base.x) / base.width, 10);
    expect((point.y - zoomed.y) / zoomed.height).toBeCloseTo((point.y - base.y) / base.height, 10);
  });

  it("halves the view when zooming in twofold", () => {
    expect(zoomAt(base, base, 2, { x: 400, y: 280 }).width).toBeCloseTo(400, 10);
  });

  it("cannot escape the extent while zooming at a corner", () => {
    const zoomed = zoomAt(base, base, 4, { x: 0, y: 0 });

    expect(zoomed.x).toBeGreaterThanOrEqual(0);
    expect(zoomed.y).toBeGreaterThanOrEqual(0);
  });

  it("returns to the whole state when zoomed all the way out", () => {
    const zoomed = zoomAt(base, base, 4, { x: 400, y: 280 });

    expect(zoomAt(zoomed, base, 0.01, { x: 400, y: 280 })).toStrictEqual(base);
  });
});

describe("panBy", () => {
  const view = zoomAt(base, base, 2, { x: 400, y: 280 });

  it("moves the view", () => {
    expect(panBy(view, base, 50, 20).x).toBeCloseTo(view.x + 50, 10);
  });

  it("stops at the edge instead of leaving the state", () => {
    expect(panBy(view, base, 10_000, 10_000)).toStrictEqual({
      ...view,
      x: base.width - view.width,
      y: base.height - view.height,
    });
  });
});

describe("zoomOf and pointerToMap", () => {
  it("reports the zoom as a multiple of the whole state", () => {
    expect(zoomOf(base, base)).toBe(1);
    expect(zoomOf(zoomAt(base, base, 4, { x: 400, y: 280 }), base)).toBeCloseTo(4, 10);
  });

  it("maps a pointer through the current view", () => {
    const box = { left: 100, top: 50, width: 400, height: 280 } as DOMRect;

    expect(pointerToMap(base, box, 300, 190)).toStrictEqual({ x: 400, y: 280 });
  });
});
