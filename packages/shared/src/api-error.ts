import { z } from 'zod';
import { ErrorCode } from './error-codes';

/** Wire format of every API error (CLAUDE.md rule 12). */
export const apiErrorBodySchema = z.object({
  statusCode: z.number().int(),
  code: z.enum(ErrorCode),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string(),
});
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return apiErrorBodySchema.safeParse(value).success;
}
