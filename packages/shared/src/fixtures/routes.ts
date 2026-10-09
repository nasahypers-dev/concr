import type { GeoPoint } from '../domain/common';
import { densifyPolyline } from '../geo/geo';

/**
 * Approximate road route from the Novxanı plant to the Yasamal site (placeholder waypoints,
 * densified so the mock tracker moves smoothly). Replaced by Google Routes geometry later.
 */
const NOVXANI_TO_YASAMAL_WAYPOINTS: GeoPoint[] = [
  { lat: 40.4858529, lng: 49.8294278 },
  { lat: 40.47, lng: 49.825 },
  { lat: 40.455, lng: 49.82 },
  { lat: 40.44, lng: 49.815 },
  { lat: 40.425, lng: 49.812 },
  { lat: 40.41, lng: 49.81 },
  { lat: 40.3905, lng: 49.811 },
];

export function createRouteNovxaniToYasamal(): GeoPoint[] {
  return densifyPolyline(NOVXANI_TO_YASAMAL_WAYPOINTS, 6);
}

/** Average mixer speed assumed by the mock tracker and the haversine ETA fallback (spec §9.2). */
export const MOCK_AVERAGE_SPEED_KMH = 35;
