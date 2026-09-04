export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Fully zoomed out is the whole state; past this the shapes are just noise. */
export const MAX_ZOOM = 24;

export const parseViewBox = (viewBox: string): Viewport => {
  const [x, y, width, height] = viewBox.trim().split(/\s+/u).map(Number);

  return { x, y, width, height };
};

export const formatViewBox = ({ x, y, width, height }: Viewport) =>
  `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Keeps the view inside the state's extent and within the zoom limits, so the
 * map can never be lost off-screen or scrolled into empty space.
 */
export function clampViewport(view: Viewport, base: Viewport): Viewport {
  const width = clampNumber(view.width, base.width / MAX_ZOOM, base.width);
  const height = width * (base.height / base.width);

  return {
    width,
    height,
    x: clampNumber(view.x, base.x, base.x + base.width - width),
    y: clampNumber(view.y, base.y, base.y + base.height - height),
  };
}

/**
 * Zooms about a point, in map coordinates, so whatever is under the pointer
 * stays under the pointer. `factor` above 1 zooms in.
 */
export function zoomAt(view: Viewport, base: Viewport, factor: number, point: Point): Viewport {
  const width = clampNumber(view.width / factor, base.width / MAX_ZOOM, base.width);
  const ratio = width / view.width;

  return clampViewport(
    {
      x: point.x - (point.x - view.x) * ratio,
      y: point.y - (point.y - view.y) * ratio,
      width,
      height: width * (base.height / base.width),
    },
    base,
  );
}

export const panBy = (view: Viewport, base: Viewport, dx: number, dy: number) =>
  clampViewport({ ...view, x: view.x + dx, y: view.y + dy }, base);

/** How far the view is zoomed in, as a multiple of the whole state. */
export const zoomOf = (view: Viewport, base: Viewport) => base.width / view.width;

/** Where a pointer sits in map coordinates, given the element it is over. */
export function pointerToMap(
  view: Viewport,
  box: DOMRect,
  clientX: number,
  clientY: number,
): Point {
  return {
    x: view.x + ((clientX - box.left) / box.width) * view.width,
    y: view.y + ((clientY - box.top) / box.height) * view.height,
  };
}

/** Pan by a movement measured in screen pixels over an element of `box` size. */
export const panByPixels = (view: Viewport, base: Viewport, box: DOMRect, dx: number, dy: number) =>
  panBy(view, base, (-dx / box.width) * view.width, (-dy / box.height) * view.height);

/** Zoom about a screen position rather than a map coordinate. */
export const zoomAtPointer = (
  view: Viewport,
  base: Viewport,
  box: DOMRect,
  factor: number,
  clientX: number,
  clientY: number,
) => zoomAt(view, base, factor, pointerToMap(view, box, clientX, clientY));
