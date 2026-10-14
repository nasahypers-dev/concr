import { z } from 'zod';
import { DeliveryStatus } from '../enums';
import { isoDateTimeSchema } from './common';

/** POST /driver/deliveries/:id/status — the big buttons (spec §13); FAILED needs a reason (§8.2). */
export const driverStatusSchema = z.object({
  to: z.enum(DeliveryStatus),
  reason: z.string().trim().max(300).nullable().optional(),
});
export type DriverStatusInput = z.infer<typeof driverStatusSchema>;

/** One GPS sample from the driver phone (spec §9.1). */
export const deliveryLocationInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedKmh: z.number().min(0).max(200).nullable(),
  heading: z.number().min(0).max(360).nullable(),
  accuracyM: z.number().min(0).nullable(),
  recordedAt: isoDateTimeSchema,
});

/** The server accepts at most this many points per batch (CLAUDE.md rule 13). */
export const MAX_LOCATION_BATCH = 500;
/** Points less accurate than this are dropped (spec §9.2). */
export const MAX_ACCURACY_M = 100;

export const locationBatchSchema = z
  .array(deliveryLocationInputSchema)
  .min(1)
  .max(MAX_LOCATION_BATCH);
export type LocationBatchInput = z.infer<typeof locationBatchSchema>;

/** POST /driver/deliveries/:id/complete — receiver name + photos (spec §3 "Təhvil aktı"). */
export const completeDeliverySchema = z.object({
  receivedByName: z.string().trim().min(1, { error: 'REQUIRED' }).max(80),
  photoUris: z.array(z.string().min(1)).max(5).default([]),
});
export type CompleteDeliveryInput = z.input<typeof completeDeliverySchema>;
export type CompleteDeliveryData = z.output<typeof completeDeliverySchema>;

/** POST /driver/shift — on/off and which truck the driver took (spec §13 "mikser seçimi"). */
export const shiftSchema = z.object({
  onShift: z.boolean(),
  truckId: z.string().min(1).nullable().optional(),
});
export type ShiftInput = z.infer<typeof shiftSchema>;
