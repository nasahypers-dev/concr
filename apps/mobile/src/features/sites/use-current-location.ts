import type { GeoPoint } from '@concr/shared';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export type LocateStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'error';

/**
 * One-shot foreground GPS fix for the site picker ("use my location"). Works in Expo Go; the
 * background tracking for drivers (spec §9) is a separate, dev-build-only concern.
 */
export function useCurrentLocation(): {
  status: LocateStatus;
  locate: () => Promise<GeoPoint | null>;
} {
  const [status, setStatus] = useState<LocateStatus>('idle');

  const locate = useCallback(async (): Promise<GeoPoint | null> => {
    setStatus('locating');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setStatus('denied');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setStatus('granted');
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { status, locate };
}
