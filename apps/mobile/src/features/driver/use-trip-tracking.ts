import {
  type DeliveryLocationInput,
  type DriverDelivery,
  isTrackingDeliveryStatus,
} from '@concr/shared';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { usePushLocations } from './use-driver';

export type TrackingStatus = 'off' | 'starting' | 'on' | 'denied' | 'error';

/** Metres the phone must move before a new sample is produced. */
const MIN_DISTANCE_M = 10;

/**
 * Foreground GPS for the trip screen (spec §9.1 lite): while the trip is EN_ROUTE or ARRIVED and
 * the screen is open, samples are queued and sent in one batch every `intervalSec`. Background
 * tracking (the phone in the pocket, app closed) needs a development build and is the Phase 2
 * task described in ADR 0012.
 */
export function useTripTracking(
  trip: DriverDelivery | undefined,
  intervalSec: number,
): TrackingStatus {
  const active = trip !== undefined && isTrackingDeliveryStatus(trip.status);
  const tripId = trip?.id ?? '';
  const push = usePushLocations(tripId);
  const pushRef = useRef(push.mutateAsync);
  const [inner, setInner] = useState<TrackingStatus>('starting');

  useEffect(() => {
    pushRef.current = push.mutateAsync;
  }, [push.mutateAsync]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    const queue: DeliveryLocationInput[] = [];

    const flush = async () => {
      if (queue.length === 0) return;
      const batch = queue.splice(0, queue.length);
      try {
        await pushRef.current(batch);
      } catch {
        // The trip may have moved on (not tracking any more); the next batch tells.
      }
    };

    const start = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setInner('denied');
        return;
      }
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: intervalSec * 1000,
            distanceInterval: MIN_DISTANCE_M,
          },
          (position) => {
            const { coords, timestamp } = position;
            queue.push({
              lat: coords.latitude,
              lng: coords.longitude,
              speedKmh:
                coords.speed !== null && coords.speed >= 0
                  ? Math.min(200, Math.round(coords.speed * 3.6))
                  : null,
              heading:
                coords.heading !== null && coords.heading >= 0
                  ? Math.round(coords.heading) % 360
                  : null,
              accuracyM: coords.accuracy ?? null,
              recordedAt: new Date(timestamp).toISOString(),
            });
          },
        );
        if (cancelled) {
          subscription.remove();
          return;
        }
        setInner('on');
      } catch {
        if (!cancelled) setInner('error');
      }
    };

    void start();
    const timer = setInterval(() => void flush(), intervalSec * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      subscription?.remove();
      void flush();
    };
  }, [active, tripId, intervalSec]);

  return active ? inner : 'off';
}
