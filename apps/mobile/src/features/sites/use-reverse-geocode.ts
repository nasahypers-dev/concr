import type { GeoPoint } from '@concr/shared';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { placemarkToAddress } from './placemark';
import { type GeocodedAddress, reverseGeocodeLocalized } from './reverse-geocode';

export type GeocodeStatus = 'idle' | 'loading' | 'done' | 'failed';

/**
 * One address lookup per confirmed point: Nominatim in the app language first (Azerbaijani street
 * and district names), the device geocoder as a fallback when offline. A failure simply yields
 * null and the address field stays as it is.
 */
export function useReverseGeocode(): {
  status: GeocodeStatus;
  lookup: (point: GeoPoint) => Promise<GeocodedAddress | null>;
} {
  const [status, setStatus] = useState<GeocodeStatus>('idle');
  const locale = useSettingsStore((s) => s.locale);

  const lookup = useCallback(
    async (point: GeoPoint): Promise<GeocodedAddress | null> => {
      setStatus('loading');
      let address = await reverseGeocodeLocalized(point, locale);
      if (!address) {
        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: point.lat,
            longitude: point.lng,
          });
          const first = results[0];
          const text = first ? placemarkToAddress(first) : null;
          address = text ? { text, streetKnown: Boolean(first?.street) } : null;
        } catch {
          address = null;
        }
      }
      setStatus(address ? 'done' : 'failed');
      return address;
    },
    [locale],
  );

  return { status, lookup };
}
