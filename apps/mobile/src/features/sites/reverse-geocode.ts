import type { GeoPoint, Locale } from '@concr/shared';

/**
 * Reverse geocoding in the app's language (owner item 3, 2026-10-13). Apple's geocoder answers in
 * the phone's language ("Street"), so the primary source is OpenStreetMap Nominatim with
 * `accept-language`, which carries Azerbaijani names for Baku ("küçəsi", "rayonu"). No key, one
 * request per confirmed point (Nominatim's policy: identify the app, stay well under 1 req/s).
 * Google Geocoding with `language=az` replaces this once the owner has a Maps key (ADR 0008).
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'CONCR/0.1 (concrete ordering app; dev)';
const TIMEOUT_MS = 5000;

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  district?: string;
  city?: string;
  town?: string;
  village?: string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** "{road} {number}, {district}, {city}" without repeats; null when there is no street-level data. */
export function nominatimToAddress(a: NominatimAddress): string | null {
  const street = [a.road, a.house_number]
    .map((s) => (s ?? '').trim())
    .filter((s) => s !== '')
    .join(' ');
  const parts = [
    street,
    a.city_district ?? a.suburb ?? a.neighbourhood ?? a.district ?? '',
    a.city ?? a.town ?? a.village ?? '',
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    const key = part.toLowerCase();
    if (part === '' || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return street === '' || out.length === 0 ? null : out.join(', ');
}

export async function reverseGeocodeLocalized(
  point: GeoPoint,
  locale: Locale,
  fetchImpl: FetchLike = fetch,
): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: point.lat.toFixed(6),
    lon: point.lng.toFixed(6),
    zoom: '18',
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
    const body = (await response.json()) as { address?: NominatimAddress };
    return body.address ? nominatimToAddress(body.address) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
