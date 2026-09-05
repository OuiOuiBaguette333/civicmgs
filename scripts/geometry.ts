// Point-in-polygon and centroid maths on GeoJSON rings, in plain longitude and
// latitude. Good enough for "which district contains the middle of this
// suburb" — it is not a general GIS library and does not try to be one.

export type Position = [number, number];
export type Ring = Position[];

export interface Geometry {
  type: string;
  coordinates: unknown;
}

/** Polygons kept whole, so the first ring stays the outline and the rest holes. */
export function polygonsOf(geometry: Geometry | null): Ring[][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates as Ring[]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates as Ring[][];

  return [];
}

export function boundsOf(polygons: Ring[][]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rings of polygons) {
    for (const [x, y] of rings[0]) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Ray casting: an odd number of crossings to the right means inside. */
export function inRing([x, y]: Position, ring: Ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }

  return inside;
}

export const inPolygons = (point: Position, polygons: Ring[][]) =>
  polygons.some(
    rings => inRing(point, rings[0]) && !rings.slice(1).some(hole => inRing(point, hole)),
  );

/** Twice the signed area of a ring, unsigned — enough to pick the largest. */
export function ringArea(ring: Ring) {
  let total = 0;

  for (const [index, [x, y]] of ring.entries()) {
    const [nx, ny] = ring[(index + 1) % ring.length];
    total += x * ny - nx * y;
  }

  return Math.abs(total) / 2;
}

/** Area-weighted centroid of the largest ring — a point inside, near the middle. */
export function centroidOf(polygons: Ring[][]): Position {
  const ring = polygons
    .map(rings => rings[0])
    .reduce((a, b) => (ringArea(a) > ringArea(b) ? a : b));

  let twice = 0;
  let x = 0;
  let y = 0;

  for (const [index, [px, py]] of ring.entries()) {
    const [qx, qy] = ring[(index + 1) % ring.length];
    const cross = px * qy - qx * py;

    twice += cross;
    x += (px + qx) * cross;
    y += (py + qy) * cross;
  }

  return twice === 0 ? ring[0] : [x / (3 * twice), y / (3 * twice)];
}
