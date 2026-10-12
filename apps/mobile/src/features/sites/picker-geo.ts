import type { GeoPoint } from '@concr/shared';

const EARTH_RADIUS_M = 6_371_000;
/** Below this the centre is considered unchanged (map settling after layout, rounding). */
export const MOVED_THRESHOLD_M = 15;

/** Great-circle distance in metres. */
export function distanceMetres(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Did the user really move the pin away from where the picker opened? Apple Maps does not report
 * `isGesture`, so the picker decides by distance instead (owner item 5, 2026-10-12).
 */
export function movedFrom(
  start: GeoPoint,
  point: GeoPoint,
  minMetres = MOVED_THRESHOLD_M,
): boolean {
  return distanceMetres(start, point) > minMetres;
}
