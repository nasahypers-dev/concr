import type {
  AdminDriver,
  ReportDayRow,
  ReportProductRow,
  ReportSummary,
} from '../../domain/admin';
import type { Id, MoneyString } from '../../domain/common';
import type { Truck } from '../../domain/truck';
import type { Driver, User } from '../../domain/user';
import { DeliveryStatus, OrderStatus, STAFF_ROLES, UserRole } from '../../enums';
import { ErrorCode } from '../../error-codes';
import { addMoney, ZERO_MONEY } from '../../money/money';
import {
  type DriverInput,
  driverInputSchema,
  type ReportRange,
  reportRangeSchema,
  type ServiceAreaInput,
  serviceAreaInputSchema,
  type TruckData,
  truckInputSchema,
  type UpdateDriverInput,
  updateDriverSchema,
  type UpdateProductInput,
  updateProductSchema,
  type UpdatePumpOptionInput,
  updatePumpOptionSchema,
  type UpdateSupplierSettingsInput,
  updateSupplierSettingsSchema,
  type UpdateTruckInput,
  updateTruckSchema,
} from '../../schemas/admin';
import { ACTIVE_ORDER_STATUSES } from '../../state-machines/order-state.machine';
import type { AdminApi } from '../api-client';
import { ApiClientError } from '../errors';
import type { ParseFn } from './mock-driver-api';
import type { MockStore } from './mock-store';

export interface AdminApiContext {
  store: MockStore;
  now: () => Date;
  delay: () => Promise<void>;
  parse: ParseFn;
  currentUser: () => User;
}

/** Spec §2: the supplier admin owns prices, fleet, drivers and reports. */
const ADMIN_ROLES: readonly UserRole[] = [UserRole.SUPPLIER_ADMIN, UserRole.PLATFORM_ADMIN];

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Mock of the admin endpoints (spec §11 `/admin/*`, §14 settings + reports). Reads are open to
 * every staff role so the dispatcher can see the fleet; writes need a supplier admin. Drivers are
 * created here and nowhere else (D22); deactivating one locks the account out immediately.
 */
export function createAdminApi(ctx: AdminApiContext): AdminApi {
  const { store, now, delay, parse } = ctx;
  const supplierId = (): Id => store.data.supplier.id;

  const currentStaff = (): User => {
    const user = ctx.currentUser();
    if (!STAFF_ROLES.includes(user.role)) throw new ApiClientError(ErrorCode.FORBIDDEN);
    return user;
  };

  const currentAdmin = (): User => {
    const user = ctx.currentUser();
    if (!ADMIN_ROLES.includes(user.role)) throw new ApiClientError(ErrorCode.FORBIDDEN);
    return user;
  };

  const supplierTrucks = (): Truck[] =>
    store.data.trucks.filter((t) => t.supplierId === supplierId());

  const supplierDrivers = (): Driver[] =>
    store.data.drivers.filter((d) => d.supplierId === supplierId());

  const truckById = (id: Id): Truck => {
    const truck = supplierTrucks().find((t) => t.id === id);
    if (!truck) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { truckId: id } });
    return truck;
  };

  const driverById = (id: Id): Driver => {
    const driver = supplierDrivers().find((d) => d.id === id);
    if (!driver) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { driverId: id } });
    return driver;
  };

  const toAdminDriver = (driver: Driver): AdminDriver => ({
    ...driver,
    isActive: store.findUserById(driver.id)?.isActive ?? true,
    truck: supplierTrucks().find((t) => t.id === driver.currentTruckId) ?? null,
  });

  /** One mixer per driver and one driver per mixer; `null` parks the driver. */
  const assignTruck = (driver: Driver, truckId: Id | null): void => {
    for (const t of supplierTrucks()) if (t.currentDriverId === driver.id) t.currentDriverId = null;
    if (truckId === null) {
      driver.currentTruckId = null;
      return;
    }
    const truck = truckById(truckId);
    if (!truck.isActive) {
      throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
        details: { field: 'truckId', message: 'Truck is inactive' },
      });
    }
    const previous = supplierDrivers().find(
      (d) => d.id !== driver.id && d.currentTruckId === truck.id,
    );
    if (previous) previous.currentTruckId = null;
    truck.currentDriverId = driver.id;
    driver.currentTruckId = truck.id;
  };

  const assertPhoneFree = (phone: string, exceptUserId: Id | null): void => {
    const existing = store.findUserByPhone(phone);
    if (existing && existing.id !== exceptUserId) {
      throw new ApiClientError(ErrorCode.CONFLICT, { details: { field: 'phone' } });
    }
  };

  const assertPlateFree = (plateNumber: string, exceptTruckId: Id | null): void => {
    const existing = supplierTrucks().find(
      (t) => t.plateNumber.toLowerCase() === plateNumber.toLowerCase() && t.id !== exceptTruckId,
    );
    if (existing)
      throw new ApiClientError(ErrorCode.CONFLICT, { details: { field: 'plateNumber' } });
  };

  const summary = (range: ReportRange): ReportSummary => {
    const orders = store
      .ordersOfSupplier(supplierId())
      .filter((o) => o.requestedDate >= range.from && o.requestedDate <= range.to);
    const deliveredOf = (orderId: Id): number =>
      round2(
        store
          .deliveriesOf(orderId)
          .filter((d) => d.status === DeliveryStatus.COMPLETED)
          .reduce((sum, d) => sum + d.volumeM3, 0),
      );
    const revenueOf = (status: OrderStatus, total: MoneyString): MoneyString =>
      status === OrderStatus.COMPLETED ? total : ZERO_MONEY;

    const days = new Map<string, ReportDayRow>();
    const products = new Map<Id, ReportProductRow>();
    let volumeM3Delivered = 0;
    let revenue: MoneyString = ZERO_MONEY;
    for (const order of orders) {
      const delivered = deliveredOf(order.id);
      const earned = revenueOf(order.status, order.totalAmount);
      volumeM3Delivered = round2(volumeM3Delivered + delivered);
      revenue = addMoney(revenue, earned);

      const day = days.get(order.requestedDate) ?? {
        date: order.requestedDate,
        orders: 0,
        volumeM3: 0,
        revenue: ZERO_MONEY,
      };
      day.orders += 1;
      day.volumeM3 = round2(day.volumeM3 + delivered);
      day.revenue = addMoney(day.revenue, earned);
      days.set(order.requestedDate, day);

      const product = products.get(order.productId) ?? {
        productId: order.productId,
        grade: store.data.products.find((p) => p.id === order.productId)?.grade ?? '',
        orders: 0,
        volumeM3: 0,
        revenue: ZERO_MONEY,
      };
      product.orders += 1;
      product.volumeM3 = round2(product.volumeM3 + delivered);
      product.revenue = addMoney(product.revenue, earned);
      products.set(order.productId, product);
    }
    const count = (status: OrderStatus): number => orders.filter((o) => o.status === status).length;
    return {
      from: range.from,
      to: range.to,
      orders: {
        total: orders.length,
        active: orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length,
        completed: count(OrderStatus.COMPLETED),
        cancelled: count(OrderStatus.CANCELLED),
        rejected: count(OrderStatus.REJECTED),
      },
      volumeM3Delivered,
      revenue,
      byDay: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
      byProduct: [...products.values()].sort((a, b) => a.grade.localeCompare(b.grade)),
    };
  };

  return {
    async listProducts() {
      await delay();
      currentStaff();
      return store.data.products
        .filter((p) => p.supplierId === supplierId())
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async updateProduct(id, input) {
      await delay();
      currentAdmin();
      const product = store.data.products.find((p) => p.id === id && p.supplierId === supplierId());
      if (!product) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { productId: id } });
      const patch = parse<UpdateProductInput>(updateProductSchema, input);
      Object.assign(product, patch);
      return product;
    },

    async listPumpOptions() {
      await delay();
      currentStaff();
      return store.data.pumpOptions
        .filter((p) => p.supplierId === supplierId())
        .sort((a, b) => a.boomLengthM - b.boomLengthM);
    },

    async updatePumpOption(id, input) {
      await delay();
      currentAdmin();
      const pump = store.data.pumpOptions.find((p) => p.id === id && p.supplierId === supplierId());
      if (!pump) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { pumpOptionId: id } });
      const patch = parse<UpdatePumpOptionInput>(updatePumpOptionSchema, input);
      Object.assign(pump, patch);
      return pump;
    },

    async listTrucks() {
      await delay();
      currentStaff();
      return supplierTrucks();
    },

    async createTruck(input) {
      await delay();
      currentAdmin();
      const data = parse<TruckData>(truckInputSchema, input);
      assertPlateFree(data.plateNumber, null);
      const truck: Truck = {
        id: store.nextTruckId(),
        supplierId: supplierId(),
        plateNumber: data.plateNumber,
        type: data.type,
        capacityM3: data.capacityM3,
        boomLengthM: data.boomLengthM,
        isActive: data.isActive,
        currentDriverId: null,
      };
      store.data.trucks.push(truck);
      return truck;
    },

    async updateTruck(id, input) {
      await delay();
      currentAdmin();
      const truck = truckById(id);
      const patch = parse<UpdateTruckInput>(updateTruckSchema, input);
      if (patch.plateNumber !== undefined) assertPlateFree(patch.plateNumber, truck.id);
      Object.assign(truck, patch);
      if (!truck.isActive && truck.currentDriverId) {
        const driver = supplierDrivers().find((d) => d.id === truck.currentDriverId);
        if (driver) driver.currentTruckId = null;
        truck.currentDriverId = null;
      }
      return truck;
    },

    async listDrivers() {
      await delay();
      currentStaff();
      return supplierDrivers().map(toAdminDriver);
    },

    async createDriver(input) {
      await delay();
      currentAdmin();
      const data = parse<DriverInput>(driverInputSchema, input);
      assertPhoneFree(data.phone, null);
      const id = store.nextDriverId();
      const user: User = {
        id,
        phone: data.phone,
        email: null,
        fullName: data.fullName,
        locale: 'az',
        role: UserRole.DRIVER,
        isActive: true,
        createdAt: now().toISOString(),
      };
      const driver: Driver = {
        id,
        supplierId: supplierId(),
        fullName: data.fullName,
        phone: data.phone,
        isOnShift: false,
        currentTruckId: null,
        lastSeenAt: null,
      };
      store.data.users.push(user);
      store.data.drivers.push(driver);
      store.driverPasswords.set(id, data.password);
      if (data.truckId) assignTruck(driver, data.truckId);
      return toAdminDriver(driver);
    },

    async updateDriver(id, input) {
      await delay();
      currentAdmin();
      const driver = driverById(id);
      const user = store.findUserById(driver.id);
      const patch = parse<UpdateDriverInput>(updateDriverSchema, input);
      if (patch.phone !== undefined) assertPhoneFree(patch.phone, driver.id);
      if (patch.fullName !== undefined) {
        driver.fullName = patch.fullName;
        if (user) user.fullName = patch.fullName;
      }
      if (patch.phone !== undefined) {
        driver.phone = patch.phone;
        if (user) user.phone = patch.phone;
      }
      if (patch.truckId !== undefined) assignTruck(driver, patch.truckId);
      if (patch.password !== undefined) store.driverPasswords.set(driver.id, patch.password);
      if (patch.isActive !== undefined && user) {
        user.isActive = patch.isActive;
        if (!patch.isActive) {
          // Locked out at once: off shift, mixer freed, refresh tokens revoked (D22).
          driver.isOnShift = false;
          assignTruck(driver, null);
          for (const [token, userId] of [...store.refreshTokens]) {
            if (userId === driver.id) store.refreshTokens.delete(token);
          }
        }
      }
      return toAdminDriver(driver);
    },

    async getSettings() {
      await delay();
      currentStaff();
      return { supplier: store.data.supplier, serviceArea: store.data.serviceArea };
    },

    async updateSettings(input) {
      await delay();
      currentAdmin();
      const { dispatchPhone, ...settings } = parse<UpdateSupplierSettingsInput>(
        updateSupplierSettingsSchema,
        input,
      );
      if (dispatchPhone !== undefined) store.data.supplier.dispatchPhone = dispatchPhone;
      Object.assign(store.data.supplier.settings, settings);
      return store.data.supplier;
    },

    async updateServiceArea(input) {
      await delay();
      currentAdmin();
      const { points } = parse<ServiceAreaInput>(serviceAreaInputSchema, input);
      store.data.serviceArea.polygon = { points };
      return store.data.serviceArea;
    },

    async reportSummary(range) {
      await delay();
      currentStaff();
      return summary(parse<ReportRange>(reportRangeSchema, range));
    },
  };
}
