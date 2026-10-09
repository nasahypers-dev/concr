import type { TruckType } from '../enums';
import type { Id } from './common';

export interface Truck {
  id: Id;
  supplierId: Id;
  plateNumber: string;
  type: TruckType;
  /** 8 / 10 / 12 for mixers (spec §3), `null` for pumps. */
  capacityM3: number | null;
  /** Boom length for pumps, `null` for mixers. */
  boomLengthM: number | null;
  isActive: boolean;
  currentDriverId: Id | null;
}
