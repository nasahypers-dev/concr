import type { TripPlan } from '../domain/dispatch';
import type { Truck } from '../domain/truck';

/** Minutes between consecutive departures of one order's trips. TODO(nurlan): real loading cadence. */
export const DEFAULT_TRIP_SPACING_MIN = 30;

export type PlanMixer = Pick<Truck, 'id' | 'capacityM3' | 'currentDriverId'>;

export interface PlanDeliveriesInput {
  volumeM3: number;
  /** Mixers free for this order; trucks without a capacity (pumps) are ignored. */
  mixers: readonly PlanMixer[];
  /** Departure of the first trip; the following ones are spaced by `spacingMin`. */
  firstDepartureAt: Date;
  spacingMin?: number;
}

type Mixer = PlanMixer & { capacityM3: number };

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Spec §8.1 "avtomatik bölgü": fill from the largest mixer down; the remainder rides on the
 * smallest mixer that fits. Every mixer is used once per round; once all have a trip the round
 * restarts (a mixer goes again after it returns). Pure: the caller decides which mixers are free,
 * the dispatcher edits the proposal before it becomes the schedule.
 */
export function planDeliveries(input: PlanDeliveriesInput): TripPlan[] {
  const spacing = input.spacingMin ?? DEFAULT_TRIP_SPACING_MIN;
  const byCapacityDesc = input.mixers
    .filter((m): m is Mixer => m.capacityM3 !== null && m.capacityM3 > 0)
    .sort((a, b) => b.capacityM3 - a.capacityM3 || a.id.localeCompare(b.id));
  const largest = byCapacityDesc[0];
  if (!largest || !(input.volumeM3 > 0)) return [];
  const byCapacityAsc = [...byCapacityDesc].sort(
    (a, b) => a.capacityM3 - b.capacityM3 || a.id.localeCompare(b.id),
  );

  const trips: TripPlan[] = [];
  const used = new Set<string>();
  const firstUnused = (candidates: readonly Mixer[]): Mixer | undefined =>
    candidates.find((m) => !used.has(m.id)) ?? candidates[0];

  let remaining = round2(input.volumeM3);
  while (remaining > 0) {
    if (used.size === byCapacityDesc.length) used.clear();
    const mixer =
      remaining >= largest.capacityM3
        ? firstUnused(byCapacityDesc)
        : firstUnused(byCapacityAsc.filter((m) => m.capacityM3 >= remaining));
    if (!mixer) break; // unreachable: the largest mixer always fits what is left
    const volume = round2(Math.min(mixer.capacityM3, remaining));
    used.add(mixer.id);
    trips.push({
      sequence: trips.length + 1,
      volumeM3: volume,
      truckId: mixer.id,
      driverId: mixer.currentDriverId,
      plannedDepartureAt: new Date(
        input.firstDepartureAt.getTime() + trips.length * spacing * 60_000,
      ).toISOString(),
    });
    remaining = round2(remaining - volume);
  }
  return trips;
}
