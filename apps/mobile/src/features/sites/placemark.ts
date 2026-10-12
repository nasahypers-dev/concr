import type { LocationGeocodedAddress } from 'expo-location';

export type Placemark = Pick<
  LocationGeocodedAddress,
  'street' | 'streetNumber' | 'name' | 'district' | 'subregion' | 'city'
>;

/**
 * "{street} {number}, {district}, {city}" from a reverse-geocode result, without the country and
 * without repeated parts (Apple often returns the city as the district too). Returns null when the
 * placemark carries nothing usable, so the caller leaves the address field alone.
 */
export function placemarkToAddress(p: Placemark): string | null {
  const street = [p.street, p.streetNumber]
    .map((s) => (s ?? '').trim())
    .filter((s) => s !== '')
    .join(' ');
  const parts = [street || (p.name ?? ''), p.district ?? p.subregion ?? '', p.city ?? ''];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    const key = part.toLowerCase();
    if (part === '' || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out.length > 0 ? out.join(', ') : null;
}
