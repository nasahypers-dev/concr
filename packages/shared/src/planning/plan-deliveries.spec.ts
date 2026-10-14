import { DEFAULT_TRIP_SPACING_MIN, planDeliveries, type PlanMixer } from './plan-deliveries';

const FIRST = new Date('2026-10-10T06:00:00.000Z');

/** The seeded fleet (spec §18): 2×12, 2×10, 2×8 m³. */
const fleet: PlanMixer[] = [
  { id: 'truck_12_1', capacityM3: 12, currentDriverId: 'drv_2' },
  { id: 'truck_12_2', capacityM3: 12, currentDriverId: null },
  { id: 'truck_10_1', capacityM3: 10, currentDriverId: 'drv_1' },
  { id: 'truck_10_2', capacityM3: 10, currentDriverId: null },
  { id: 'truck_8_1', capacityM3: 8, currentDriverId: null },
  { id: 'truck_8_2', capacityM3: 8, currentDriverId: null },
];

const at = (minutes: number): string => new Date(FIRST.getTime() + minutes * 60_000).toISOString();

describe('planDeliveries (spec §8.1 automatic split)', () => {
  it('fills the largest mixers first and puts the remainder on the smallest one that fits', () => {
    expect(planDeliveries({ volumeM3: 25, mixers: fleet, firstDepartureAt: FIRST })).toEqual([
      {
        sequence: 1,
        volumeM3: 12,
        truckId: 'truck_12_1',
        driverId: 'drv_2',
        plannedDepartureAt: at(0),
      },
      {
        sequence: 2,
        volumeM3: 12,
        truckId: 'truck_12_2',
        driverId: null,
        plannedDepartureAt: at(DEFAULT_TRIP_SPACING_MIN),
      },
      {
        sequence: 3,
        volumeM3: 1,
        truckId: 'truck_8_1',
        driverId: null,
        plannedDepartureAt: at(2 * DEFAULT_TRIP_SPACING_MIN),
      },
    ]);
  });

  it('uses one trip when a single mixer fits and keeps decimals exact', () => {
    const plan = (volumeM3: number) =>
      planDeliveries({ volumeM3, mixers: fleet, firstDepartureAt: FIRST }).map((t) => [
        t.truckId,
        t.volumeM3,
      ]);
    expect(plan(8)).toEqual([['truck_8_1', 8]]);
    expect(plan(15)).toEqual([
      ['truck_12_1', 12],
      ['truck_8_1', 3],
    ]);
    expect(plan(12.5)).toEqual([
      ['truck_12_1', 12],
      ['truck_8_1', 0.5],
    ]);
  });

  it('reuses mixers in rounds when the fleet is smaller than the order', () => {
    const one = [fleet[0]!];
    expect(
      planDeliveries({ volumeM3: 30, mixers: one, firstDepartureAt: FIRST, spacingMin: 45 }).map(
        (t) => [t.truckId, t.volumeM3, t.plannedDepartureAt],
      ),
    ).toEqual([
      ['truck_12_1', 12, at(0)],
      ['truck_12_1', 12, at(45)],
      ['truck_12_1', 6, at(90)],
    ]);
  });

  it('ignores trucks without a capacity and returns nothing for an empty fleet or volume', () => {
    const pumpOnly: PlanMixer[] = [{ id: 'pump', capacityM3: null, currentDriverId: null }];
    expect(planDeliveries({ volumeM3: 10, mixers: pumpOnly, firstDepartureAt: FIRST })).toEqual([]);
    expect(planDeliveries({ volumeM3: 0, mixers: fleet, firstDepartureAt: FIRST })).toEqual([]);
  });
});
