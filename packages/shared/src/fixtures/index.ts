import type { GeoPoint, Id } from '../domain/common';
import type { Delivery, DeliveryDocument, DeliveryLocation } from '../domain/delivery';
import type { Order, OrderEvent } from '../domain/order';
import type { Product, PumpOption } from '../domain/product';
import type { Site } from '../domain/site';
import type { Plant, ServiceArea, Supplier } from '../domain/supplier';
import type { Truck } from '../domain/truck';
import type { CustomerAccount, Driver, User } from '../domain/user';
import { createProducts, createPumpOptions } from './catalog';
import { createCustomers, createSites, createStaffUsers } from './customers';
import { createDriverUsers, createDrivers, createTrucks } from './fleet';
import { createOrderFixtures } from './orders';
import { createRouteNovxaniToYasamal } from './routes';
import { createPlant, createServiceArea, createSupplier } from './supplier';

export * from './catalog';
export * from './customers';
export * from './fleet';
export * from './orders';
export * from './routes';
export * from './supplier';
export * from './time';

/**
 * The complete mock dataset (spec §18 seed, as data). Everything is created fresh on each call so
 * the mock API client can mutate its copy; `now` anchors all relative dates.
 */
export interface FixtureSet {
  now: Date;
  supplier: Supplier;
  plant: Plant;
  serviceArea: ServiceArea;
  products: Product[];
  pumpOptions: PumpOption[];
  trucks: Truck[];
  drivers: Driver[];
  users: User[];
  customers: CustomerAccount[];
  sites: Site[];
  orders: Order[];
  deliveries: Delivery[];
  events: OrderEvent[];
  documents: DeliveryDocument[];
  locations: DeliveryLocation[];
  routes: Record<Id, GeoPoint[]>;
}

export function createFixtures(now: Date = new Date()): FixtureSet {
  const supplier = createSupplier();
  const products = createProducts();
  const pumpOptions = createPumpOptions();
  const customers = createCustomers(now);
  const orderSet = createOrderFixtures({
    now,
    supplier,
    products,
    pumpOptions,
    routeToYasamal: createRouteNovxaniToYasamal(),
  });
  return {
    now,
    supplier,
    plant: createPlant(),
    serviceArea: createServiceArea(),
    products,
    pumpOptions,
    trucks: createTrucks(),
    drivers: createDrivers(now),
    users: [
      ...customers.map(({ profile: _profile, ...user }) => user),
      ...createDriverUsers(now),
      ...createStaffUsers(now),
    ],
    customers,
    sites: createSites(now),
    ...orderSet,
  };
}
