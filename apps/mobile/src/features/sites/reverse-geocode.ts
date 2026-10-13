import type { GeoPoint, Locale } from '@concr/shared';
import { dedupeParts, pickLocality } from './address-parts';

/**
 * Reverse geocoding in the app's language (owner item 3, 2026-10-13). Apple's geocoder answers in
 * the phone's language ("Street"), so the primary source is OpenStreetMap Nominatim with
 * `accept-language`, which carries Azerbaijani names for Baku ("küçəsi"). No key, at most two
 * requests per confirmed point (Nominatim's policy: identify the app, stay well under 1 req/s).
 * Google Geocoding with `language=az` replaces this once the owner has a Maps key (ADR 0008).
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'CONCR/0.1 (concrete ordering app; dev)';
const TIMEOUT_MS = 5000;
/**
 * Outside the city centre Nominatim snaps to the nearest named road, which can be a few hundred
 * metres away; a street whose extent is further than this from the point is dropped (~150 m).
 */
const STREET_MARGIN_DEG = 0.0015;
/** First the address point (buildings), then the street itself when no building carried one. */
const ZOOM_LEVELS = ['18', '17'] as const;

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city_district?: string;
  district?: string;
  county?: string;
  city?: string;
}

export interface NominatimResult {
  lat?: string;
  lon?: string;
  /** [minLat, maxLat, minLon, maxLon] of the matched object. */
  boundingbox?: [string, string, string, string];
  address?: NominatimAddress;
}

export interface GeocodedAddress {
  text: string;
  /** false when only the locality and city could be trusted; the customer adds the street. */
  streetKnown: boolean;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Is the point inside (or within `margin` degrees of) the matched object's bounding box? */
export function isNearResult(
  point: GeoPoint,
  result: NominatimResult,
  margin = STREET_MARGIN_DEG,
): boolean {
  if (!result.boundingbox) return true;
  const [minLat, maxLat, minLon, maxLon] = result.boundingbox.map(Number);
  if ([minLat, maxLat, minLon, maxLon].some((n) => !Number.isFinite(n))) return true;
  return (
    point.lat >= minLat! - margin &&
    point.lat <= maxLat! + margin &&
    point.lng >= minLon! - margin &&
    point.lng <= maxLon! + margin
  );
}

/**
 * The most specific place name (a quarter or settlement such as Bilgəh). OSM sometimes files the
 * rayon under `suburb`, so administrative names are skipped wherever they appear.
 */
export function localityOf(a: NominatimAddress): string {
  return pickLocality([
    a.neighbourhood,
    a.quarter,
    a.village,
    a.suburb,
    a.city ? a.town : undefined,
  ]);
}

/**
 * "{road} {number}, {locality}, {city}" the way ride-hailing apps show it (owner, 2026-10-13):
 * the specific place instead of the rayon, the street only when `includeStreet`.
 */
export function nominatimToAddress(
  a: NominatimAddress,
  includeStreet = true,
): GeocodedAddress | null {
  const street = includeStreet
    ? [a.road, a.house_number]
        .map((s) => (s ?? '').trim())
        .filter((s) => s !== '')
        .join(' ')
    : '';
  const parts = dedupeParts([street, localityOf(a), a.city ?? a.town ?? '']);
  if (parts.length === 0) return null;
  return { text: parts.join(', '), streetKnown: street !== '' };
}

async function query(
  point: GeoPoint,
  locale: Locale,
  zoom: string,
  fetchImpl: FetchLike,
): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: point.lat.toFixed(6),
    lon: point.lng.toFixed(6),
    zoom,
    addressdetails: '1',
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${locale},az;q=0.8,ru;q=0.6`,
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as NominatimResult;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function reverseGeocodeLocalized(
  point: GeoPoint,
  locale: Locale,
  fetchImpl: FetchLike = fetch,
): Promise<GeocodedAddress | null> {
  let best: GeocodedAddress | null = null;
  for (const zoom of ZOOM_LEVELS) {
    const result = await query(point, locale, zoom, fetchImpl);
    if (!result?.address) continue;
    const candidate = nominatimToAddress(result.address, isNearResult(point, result));
    if (!candidate) continue;
    if (candidate.streetKnown) return candidate;
    best ??= candidate;
  }
  return best;
}
