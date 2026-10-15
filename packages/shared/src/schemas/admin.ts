import { z } from 'zod';
import { SlumpClass, TruckType } from '../enums';
import { moneyStringSchema, phoneE164Schema } from './common';
import { geoPointSchema, isoDateSchema } from './order';

/** PATCH /admin/products/:id — price list and catalogue flags (spec §14 item 6). */
export const updateProductSchema = z.object({
  basePrice: moneyStringSchema.optional(),
  strengthClass: z.string().trim().max(20).nullable().optional(),
  description: z.string().trim().max(300).nullable().optional(),
  slumpOptions: z.array(z.enum(SlumpClass)).min(1).optional(),
  minQty: z.number().positive().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(1).optional(),
  isPopular: z.boolean().optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const updatePumpOptionSchema = z.object({
  pricePerOrder: moneyStringSchema.nullable().optional(),
  pricePerM3: moneyStringSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePumpOptionInput = z.infer<typeof updatePumpOptionSchema>;

const truckFields = z.object({
  plateNumber: z.string().trim().min(3, { error: 'REQUIRED' }).max(16),
  type: z.enum(TruckType),
  /** Mixer drum size (D5: 8 / 10 / 12); null for pumps. */
  capacityM3: z.number().positive().max(30).nullable(),
  /** Pump boom; null for mixers. */
  boomLengthM: z.number().positive().max(100).nullable(),
  isActive: z.boolean().default(true),
});

export const truckInputSchema = truckFields.refine(
  (t) => (t.type === TruckType.MIXER ? t.capacityM3 !== null : t.boomLengthM !== null),
  { error: 'CAPACITY_REQUIRED' },
);
export type TruckInput = z.input<typeof truckInputSchema>;
export type TruckData = z.output<typeof truckInputSchema>;

export const updateTruckSchema = truckFields.partial();
export type UpdateTruckInput = z.infer<typeof updateTruckSchema>;

/** POST /admin/drivers — the only way a driver account comes to exist (D22). */
export const driverInputSchema = z.object({
  fullName: z.string().trim().min(1, { error: 'REQUIRED' }).max(80),
  phone: phoneE164Schema,
  truckId: z.string().min(1).nullable().optional(),
  /** Initial password; the driver signs in with it (D22, amended 2026-10-15). */
  password: z.string().min(8, { error: 'PASSWORD_TOO_SHORT' }).max(128),
});
export type DriverInput = z.infer<typeof driverInputSchema>;

/** Every field optional; a `password` here resets the driver's password. */
export const updateDriverSchema = driverInputSchema.partial().extend({
  /** false locks the account out of the app at once (D22). */
  isActive: z.boolean().optional(),
});
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

/** PATCH /admin/supplier/settings — every field optional, ranges keep the panel honest. */
export const updateSupplierSettingsSchema = z.object({
  dispatchPhone: phoneE164Schema.optional(),
  minOrderM3: z.number().positive().max(100).optional(),
  vatRate: z.number().min(0).max(1).optional(),
  leadTimeHours: z.number().min(0).max(72).optional(),
  cancelCutoffHours: z.number().min(0).max(168).optional(),
  workingHours: z.string().trim().min(1).max(40).optional(),
  concreteLifetimeMin: z.number().int().min(30).max(240).optional(),
  locationUpdateIntervalSec: z.number().int().min(5).max(60).optional(),
  arrivalGeofenceM: z.number().int().min(50).max(1000).optional(),
});
export type UpdateSupplierSettingsInput = z.infer<typeof updateSupplierSettingsSchema>;

export const serviceAreaInputSchema = z.object({
  points: z.array(geoPointSchema).min(3).max(200),
});
export type ServiceAreaInput = z.infer<typeof serviceAreaInputSchema>;

export const reportRangeSchema = z
  .object({ from: isoDateSchema, to: isoDateSchema })
  .refine((r) => r.from <= r.to, { error: 'INVALID_RANGE' });
export type ReportRange = z.infer<typeof reportRangeSchema>;
