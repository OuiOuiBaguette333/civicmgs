import { type Seat, SEATS_2022 } from "@data/seats2022";

/** How far above an even split the winner finished. */
export const marginOf = (seat: Seat) => seat.twoCandidatePreferred - 50;

export type Safeness = "marginal" | "fairly safe" | "safe";

/**
 * The conventional Australian thresholds: under six points is reachable on an
 * ordinary swing, six to ten is not, and past ten needs an unusual one. They are a rule of thumb
 * rather than a law, which is why the margin itself is always shown beside the
 * word.
 */
const FAIRLY_SAFE_FROM = 6;
const SAFE_FROM = 10;

export function safenessOf(margin: number): Safeness {
  if (margin < FAIRLY_SAFE_FROM) return "marginal";

  return margin <= SAFE_FROM ? "fairly safe" : "safe";
}

export const seatByDistrict = new Map(SEATS_2022.map(seat => [seat.district, seat]));

/** The widest margin in the state, so every bar is drawn to one scale. */
export const WIDEST_MARGIN = Math.max(...SEATS_2022.map(seat => marginOf(seat)));
