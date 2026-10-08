// Domain enums shared by API, mobile and web. Plain `as const` objects (not TS enums)
// so they work with zod (`z.enum(UserRole)`), Prisma string enums and JSON wire format.

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  DISPATCHER: 'DISPATCHER',
  DRIVER: 'DRIVER',
  SUPPLIER_ADMIN: 'SUPPLIER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Roles that belong to a supplier organisation and go through SupplierScopeGuard. */
export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.DISPATCHER,
  UserRole.SUPPLIER_ADMIN,
  UserRole.PLATFORM_ADMIN,
];

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const DeliveryStatus = {
  PLANNED: 'PLANNED',
  ASSIGNED: 'ASSIGNED',
  LOADING: 'LOADING',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  UNLOADING: 'UNLOADING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

/** GPS is collected only while a delivery is in one of these statuses (spec §9.1). */
export const TRACKING_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  DeliveryStatus.EN_ROUTE,
  DeliveryStatus.ARRIVED,
];

export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT: 'CREDIT',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ProductCategory = {
  CONCRETE: 'CONCRETE',
  AGGREGATE: 'AGGREGATE',
} as const;
export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const ProductUnit = {
  M3: 'M3',
  TON: 'TON',
} as const;
export type ProductUnit = (typeof ProductUnit)[keyof typeof ProductUnit];

export const TruckType = {
  MIXER: 'MIXER',
  PUMP: 'PUMP',
} as const;
export type TruckType = (typeof TruckType)[keyof typeof TruckType];

export const CustomerType = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const SlumpClass = {
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
} as const;
export type SlumpClass = (typeof SlumpClass)[keyof typeof SlumpClass];

export const CURRENCY = 'AZN' as const;
