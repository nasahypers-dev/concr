import { z } from 'zod';

/** E.164 phone, e.g. "+994506209584" (CLAUDE.md rule 11). */
export const phoneE164Schema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, { error: 'INVALID_PHONE' });

/** Money on the wire is a decimal string with two fraction digits, e.g. "110.00" (AZN). */
export const moneyStringSchema = z.string().regex(/^\d+\.\d{2}$/, { error: 'INVALID_MONEY' });

export const uuidSchema = z.uuid();

export const idParamSchema = z.object({ id: uuidSchema });
export type IdParam = z.infer<typeof idParamSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** ISO-8601 UTC timestamp string, e.g. "2026-10-08T12:00:00.000Z". */
export const isoDateTimeSchema = z.iso.datetime();
