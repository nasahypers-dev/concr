import type { Truck } from '../domain/truck';
import type { Driver, User } from '../domain/user';
import { TruckType, UserRole } from '../enums';
import { SUPPLIER_ID } from './supplier';

export const TRUCK_IDS = {
  mixer8a: 'truck_8_1',
  mixer8b: 'truck_8_2',
  mixer10a: 'truck_10_1',
  mixer10b: 'truck_10_2',
  mixer12a: 'truck_12_1',
  mixer12b: 'truck_12_2',
  pump24: 'truck_pump_24',
} as const;

export const DRIVER_IDS = {
  elshan: 'drv_1',
  rauf: 'drv_2',
  kamran: 'drv_3',
} as const;

/** Fleet per spec §18: 2×8, 2×10, 2×12 m³ mixers + one 24 m pump. TODO(nurlan): real plates and counts. */
export function createTrucks(): Truck[] {
  const mixer = (id: string, plate: string, capacity: number, driverId: string | null): Truck => ({
    id,
    supplierId: SUPPLIER_ID,
    plateNumber: plate,
    type: TruckType.MIXER,
    capacityM3: capacity,
    boomLengthM: null,
    isActive: true,
    currentDriverId: driverId,
  });
  return [
    mixer(TRUCK_IDS.mixer8a, '90-AA-001', 8, null),
    mixer(TRUCK_IDS.mixer8b, '90-AA-002', 8, null),
    mixer(TRUCK_IDS.mixer10a, '90-AA-003', 10, DRIVER_IDS.elshan),
    mixer(TRUCK_IDS.mixer10b, '90-AA-004', 10, null),
    mixer(TRUCK_IDS.mixer12a, '90-AA-005', 12, DRIVER_IDS.rauf),
    mixer(TRUCK_IDS.mixer12b, '90-AA-006', 12, null),
    {
      id: TRUCK_IDS.pump24,
      supplierId: SUPPLIER_ID,
      plateNumber: '90-AA-007',
      type: TruckType.PUMP,
      capacityM3: null,
      boomLengthM: 24,
      isActive: true,
      currentDriverId: null,
    },
  ];
}

/** Three drivers (spec §18). TODO(nurlan): real names and phones. */
export function createDrivers(now: Date): Driver[] {
  const recently = new Date(now.getTime() - 45_000).toISOString();
  return [
    {
      id: DRIVER_IDS.elshan,
      supplierId: SUPPLIER_ID,
      fullName: 'Elşən Məmmədov',
      phone: '+994500000011',
      isOnShift: true,
      currentTruckId: TRUCK_IDS.mixer10a,
      lastSeenAt: recently,
    },
    {
      id: DRIVER_IDS.rauf,
      supplierId: SUPPLIER_ID,
      fullName: 'Rauf Əliyev',
      phone: '+994500000012',
      isOnShift: true,
      currentTruckId: TRUCK_IDS.mixer12a,
      lastSeenAt: recently,
    },
    {
      id: DRIVER_IDS.kamran,
      supplierId: SUPPLIER_ID,
      fullName: 'Kamran Hüseynov',
      phone: '+994500000013',
      isOnShift: false,
      currentTruckId: null,
      lastSeenAt: null,
    },
  ];
}

/** Driver user accounts (phone + OTP login). */
export function createDriverUsers(now: Date): User[] {
  const createdAt = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  return createDrivers(now).map((driver) => ({
    id: driver.id,
    phone: driver.phone,
    email: null,
    fullName: driver.fullName,
    locale: 'az',
    role: UserRole.DRIVER,
    isActive: true,
    createdAt,
  }));
}
