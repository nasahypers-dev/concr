import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { API_PREFIX } from '../../app.constants';
import type { Env } from '../../config/env';

const REQUEST_ID_HEADER = 'x-request-id';
const LIVENESS_PATH = `/${API_PREFIX}/health`;

/** Reuse a sane client-provided id (useful for tracing from the mobile app), otherwise mint one. */
export function generateRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  const id =
    typeof candidate === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(candidate)
      ? candidate
      : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}

/**
 * Structured pino logging with requestId on every line (CLAUDE.md "Logging").
 * Pretty output in development, JSON elsewhere. Secrets and phones are redacted.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isDev = config.get('NODE_ENV', { infer: true }) === 'development';
        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', { infer: true }),
            genReqId: generateRequestId,
            autoLogging: {
              ignore: (req: IncomingMessage) => req.url === LIVENESS_PATH,
            },
            customLogLevel: (_req: IncomingMessage, res: ServerResponse, error?: Error) => {
              if (error || res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            // pino-http fabricates `new Error('failed with status code 5xx')` for every 5xx and logs its
            // (meaningless) stack. Real exceptions are already logged with their stack by
            // AllExceptionsFilter, so keep only the response for synthetic ones.
            customErrorObject: (
              _req: IncomingMessage,
              _res: ServerResponse,
              error: Error,
              logObject: Record<string, unknown>,
            ) => {
              if (error.message.startsWith('failed with status code')) {
                const { err: _err, ...rest } = logObject;
                return rest;
              }
              return logObject;
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.phone',
                'req.body.password',
                'req.body.code',
              ],
              censor: '***',
            },
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true, translateTime: 'HH:MM:ss.l' },
                }
              : undefined,
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
