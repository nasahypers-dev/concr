import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

/**
 * Environment contract. Documented line by line in `.env.example`.
 * Defaults match infra/docker-compose.yml so a fresh clone boots without a `.env`.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  // 127.0.0.1 instead of localhost: avoids Node's IPv6-first fallback so a refused
  // connection fails instantly (matters for /health/ready and test teardown).
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://concr:concr@127.0.0.1:5432/concr?schema=public'),
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3001')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  // TODO(nurlan): replaced by the real supplier id after the Phase 1 seed.
  DEFAULT_SUPPLIER_ID: z.uuid().default('00000000-0000-0000-0000-000000000000'),
});

export type Env = z.infer<typeof envSchema>;

/** Used by ConfigModule.forRoot({ validate }). Throws with a readable report on bad config. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
