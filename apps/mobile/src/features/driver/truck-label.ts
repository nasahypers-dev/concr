import type { Truck } from '@concr/shared';
import { formatVolume } from '@/lib/format';

/** "90-TR-631 · 12 m³" for mixers, the plate alone for pumps. */
export function truckLabel(truck: Truck): string {
  return truck.capacityM3 === null
    ? truck.plateNumber
    : `${truck.plateNumber} · ${formatVolume(truck.capacityM3)}`;
}
