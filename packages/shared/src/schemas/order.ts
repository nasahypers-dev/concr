import { z } from 'zod';
import { PaymentMethod, ProductCategory, SlumpClass } from '../enums';
import { locales } from '../i18n';
import { phoneE164Schema } from './common';

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'INVALID_DATE' });
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'INVALID_TIME' });

/** Volume in m³: positive, at most two decimals, sane upper bound (spec §3). */
export const volumeM3Schema = z
  .number()
  .positive({ error: 'INVALID_VOLUME' })
  .max(1000, { error: 'INVALID_VOLUME' })
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9, { error: 'INVALID_VOLUME' });

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const quoteRequestSchema = z.object({
  productId: z.string().min(1),
  volumeM3: volumeM3Schema,
  pumpOptionId: z.string().min(1).nullable(),
  /** Either an existing site or a raw location (new site in the wizard). */
  siteId: z.string().min(1).nullable().optional(),
  location: geoPointSchema.nullable().optional(),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const createOrderSchema = z.object({
  productId: z.string().min(1),
  siteId: z.string().min(1),
  volumeM3: volumeM3Schema,
  slump: z.enum(SlumpClass).nullable(),
  pumpRequired: z.boolean(),
  pumpOptionId: z.string().min(1).nullable(),
  requestedDate: isoDateSchema,
  timeWindowStart: timeOfDaySchema,
  timeWindowEnd: timeOfDaySchema,
  paymentMethod: z.enum(PaymentMethod),
  customerNote: z.string().trim().max(500).nullable(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(300).nullable().optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const listOrdersQuerySchema = z.object({
  status: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListOrdersQuery = z.input<typeof listOrdersQuerySchema>;

export const siteInputSchema = z.object({
  name: z.string().trim().min(1, { error: 'REQUIRED' }).max(80),
  addressLine: z.string().trim().min(1, { error: 'REQUIRED' }).max(200),
  location: geoPointSchema,
  accessNotes: z.string().trim().max(500).nullable(),
  contactName: z.string().trim().max(80).nullable(),
  contactPhone: phoneE164Schema,
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(locales).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const listProductsQuerySchema = z.object({
  category: z.enum(ProductCategory).optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
