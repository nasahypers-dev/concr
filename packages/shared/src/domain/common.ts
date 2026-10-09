/** Entity identifier. Mock fixtures use readable ids; the API uses UUIDs. Never parse it. */
export type Id = string;

/** ISO-8601 UTC timestamp, e.g. "2026-10-09T08:30:00.000Z" (CLAUDE.md rule 11). */
export type IsoDateTime = string;

/** Calendar date without time, e.g. "2026-10-12" (the supplier's local day). */
export type IsoDate = string;

/** "HH:mm" in the supplier's local time, e.g. "08:00". */
export type TimeOfDay = string;

/** Decimal string with two fraction digits, AZN, e.g. "110.00" (CLAUDE.md rule 11). */
export type MoneyString = string;

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Closed ring without repeating the first point. */
export interface GeoPolygon {
  points: GeoPoint[];
}
