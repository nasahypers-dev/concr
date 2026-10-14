import { z } from 'zod';
import { OrderStatus } from '../enums';
import { isoDateTimeSchema, moneyStringSchema, paginationQuerySchema } from './common';
import { isoDateSchema, timeOfDaySchema, volumeM3Schema } from './order';

/** GET /dispatch/orders — inbox and history filters (spec §14). */
export const listDispatchOrdersSchema = paginationQuerySchema.extend({
  status: z.array(z.enum(OrderStatus)).optional(),
  /** Requested delivery day (Baku calendar date). */
  date: isoDateSchema.optional(),
  /** Case-insensitive substring of the order number, customer name/phone or site name. */
  search: z.string().trim().max(80).optional(),
});
export type ListDispatchOrdersQuery = z.input<typeof listDispatchOrdersSchema>;
export type ListDispatchOrdersData = z.output<typeof listDispatchOrdersSchema>;

/** Every dispatcher decision that needs a "why" (spec §8.1) carries at least a few characters. */
const reasonSchema = z.string().trim().min(3, { error: 'REQUIRED' }).max(300);

/** POST /dispatch/orders/:id/confirm — optional price / window overrides, each with a reason. */
export const confirmOrderSchema = z.object({
  /** Pump fee set by the dispatcher when the catalogue has no price for the pump (spec §10). */
  pumpFee: moneyStringSchema.optional(),
  priceOverride: z.object({ total: moneyStringSchema, reason: reasonSchema }).optional(),
  schedule: z
    .object({
      requestedDate: isoDateSchema,
      timeWindowStart: timeOfDaySchema,
      timeWindowEnd: timeOfDaySchema,
      reason: reasonSchema,
    })
    .optional(),
  internalNote: z.string().trim().max(500).nullable().optional(),
});
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;

export const rejectOrderSchema = z.object({ reason: reasonSchema });
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;

/** Dispatcher cancellation always needs a reason (state machine `reasonRequiredFor`). */
export const dispatchCancelSchema = z.object({ reason: reasonSchema });
export type DispatchCancelInput = z.infer<typeof dispatchCancelSchema>;

export const tripPlanSchema = z.object({
  sequence: z.number().int().min(1),
  volumeM3: volumeM3Schema,
  truckId: z.string().min(1),
  driverId: z.string().min(1).nullable(),
  plannedDepartureAt: isoDateTimeSchema,
});

export const MAX_TRIPS_PER_ORDER = 20;

/** POST /dispatch/orders/:id/schedule — the (edited) proposal becomes the deliveries. */
export const scheduleOrderSchema = z.object({
  trips: z.array(tripPlanSchema).min(1).max(MAX_TRIPS_PER_ORDER),
});
export type ScheduleOrderInput = z.infer<typeof scheduleOrderSchema>;

/** PATCH of a planned trip from the board: mixer, driver and/or departure. */
export const reassignDeliverySchema = z
  .object({
    truckId: z.string().min(1).optional(),
    driverId: z.string().min(1).nullable().optional(),
    plannedDepartureAt: isoDateTimeSchema.optional(),
  })
  .refine(
    (v) =>
      v.truckId !== undefined || v.driverId !== undefined || v.plannedDepartureAt !== undefined,
    { error: 'EMPTY_PATCH' },
  );
export type ReassignDeliveryInput = z.infer<typeof reassignDeliverySchema>;
