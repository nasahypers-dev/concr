import type { LocationGeocodedAddress } from 'expo-location';
import { dedupeParts, pickLocality } from './address-parts';

export type Placemark = Pick<
  LocationGeocodedAddress,
  'street' | 'streetNumber' | 'name' | 'district' | 'subregion' | 'city'
>;

/**
 * "{street} {number}, {locality}, {city}" from the device geocoder, without the country, without
 * administrative districts and without repeated parts (Apple often returns the city as the district
 * too). Returns null when the placemark carries nothing usable, so the caller leaves the field alone.
 */
export function placemarkToAddress(p: Placemark): string | null {
  const street = [p.street, p.streetNumber]
    .map((s) => (s ?? '').trim())
    .filter((s) => s !== '')
    .join(' ');
  const parts = dedupeParts([
    street || (p.name ?? ''),
    pickLocality([p.district, p.subregion]),
    pickLocality([p.city]),
  ]);
  return parts.length > 0 ? parts.join(', ') : null;
}
