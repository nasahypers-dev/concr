import type { GeoPoint } from '@concr/shared';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { placemarkToAddress } from './placemark';

export type GeocodeStatus = 'idle' | 'loading' | 'done' | 'failed';

/**
 * One reverse-geocode per confirmed point (Apple rate-limits bursts). Works in Expo Go; on Android
 * it needs the foreground permission, so a failure simply yields null and the field stays as is.
 */
export function useReverseGeocode(): {
  status: GeocodeStatus;
  lookup: (point: GeoPoint) => Promise<string | null>;
} {
  const [status, setStatus] = useState<GeocodeStatus>('idle');

  const lookup = useCallback(async (point: GeoPoint): Promise<string | null> => {
    setStatus('loading');
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: point.lat,
        longitude: point.lng,
      });
      const first = results[0];
      const address = first ? placemarkToAddress(first) : null;
      setStatus(address ? 'done' : 'failed');
      return address;
    } catch {
      setStatus('failed');
      return null;
    }
  }, []);

  return { status, lookup };
}
