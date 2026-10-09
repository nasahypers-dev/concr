import type { GeoPoint, GeoPolygon } from '../domain/common';

const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b, degrees clockwise from north in [0, 360). */
export function bearingDeg(a: GeoPoint, b: GeoPoint): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Ray-casting point-in-polygon; points exactly on an edge count as inside. */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPolygon): boolean {
  const { points } = polygon;
  if (points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const pi = points[i];
    const pj = points[j];
    if (!pi || !pj) continue;
    if (isOnSegment(point, pi, pj)) return true;
    const intersects =
      pi.lat > point.lat !== pj.lat > point.lat &&
      point.lng < ((pj.lng - pi.lng) * (point.lat - pi.lat)) / (pj.lat - pi.lat) + pi.lng;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isOnSegment(p: GeoPoint, a: GeoPoint, b: GeoPoint): boolean {
  const cross = (b.lat - a.lat) * (p.lng - a.lng) - (b.lng - a.lng) * (p.lat - a.lat);
  if (Math.abs(cross) > 1e-12) return false;
  const withinLat = Math.min(a.lat, b.lat) <= p.lat && p.lat <= Math.max(a.lat, b.lat);
  const withinLng = Math.min(a.lng, b.lng) <= p.lng && p.lng <= Math.max(a.lng, b.lng);
  return withinLat && withinLng;
}

export function polylineLengthKm(points: readonly GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    if (prev && next) total += haversineKm(prev, next);
  }
  return total;
}

export interface PolylinePosition {
  point: GeoPoint;
  /** Heading of travel at that point, degrees from north. */
  heading: number;
  /** Index of the segment the point lies on. */
  segmentIndex: number;
}

/**
 * Position along a polyline at `fraction` ∈ [0, 1] of its total length (linear within segments).
 * Used by the mock tracker to move the mixer marker and later by tests of the real pipeline.
 */
export function interpolateAlongPolyline(
  points: readonly GeoPoint[],
  fraction: number,
): PolylinePosition {
  const first = points[0];
  if (!first) throw new RangeError('Polyline needs at least one point');
  if (points.length === 1) return { point: first, heading: 0, segmentIndex: 0 };
  const clamped = Math.min(1, Math.max(0, fraction));
  const target = polylineLengthKm(points) * clamped;
  let travelled = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const segment = haversineKm(a, b);
    if (travelled + segment > target || i === points.length - 1) {
      const t = segment === 0 ? 0 : Math.min(1, (target - travelled) / segment);
      return {
        point: { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t },
        heading: bearingDeg(a, b),
        segmentIndex: i - 1,
      };
    }
    travelled += segment;
  }
  const last = points[points.length - 1] ?? first;
  return { point: last, heading: 0, segmentIndex: points.length - 2 };
}

/** Inserts `perSegment` evenly spaced points between consecutive waypoints. */
export function densifyPolyline(waypoints: readonly GeoPoint[], perSegment: number): GeoPoint[] {
  if (waypoints.length < 2 || perSegment < 1) return [...waypoints];
  const result: GeoPoint[] = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (!a || !b) continue;
    for (let k = 0; k < perSegment; k += 1) {
      const t = k / perSegment;
      result.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    }
  }
  const last = waypoints[waypoints.length - 1];
  if (last) result.push(last);
  return result;
}
