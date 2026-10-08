# 0003. API conventions: error envelope, zod validation, request id, health probes

Date: 2026-10-08
Status: accepted

## Context

CLAUDE.md requires one error shape `{ statusCode, code, message, details?, requestId }` with codes from
`@concr/shared`, zod validation on every endpoint, structured logging with request ids and masked phones,
and a `/health` endpoint that answers 200 for the Phase 0 definition of done even without infrastructure.

## Decision

- Global prefix `api/v1`; Swagger UI at `/api/docs`, JSON at `/api/docs-json`, exported to
  `docs/api/openapi.json` by `npm run openapi:export` (runs against the compiled `dist/`, because
  Nest needs `emitDecoratorMetadata`, which esbuild-based TS runners do not produce).
- Validation: `nestjs-zod` `ZodValidationPipe` registered as `APP_PIPE`; DTOs are `createZodDto(schema)`
  with schemas from `@concr/shared` whenever the client needs them too.
- Errors: throw only `AppException(code, { status?, message?, details? })`. `AllExceptionsFilter`
  (`APP_FILTER`) maps `ZodValidationException` → `VALIDATION_ERROR` with flattened issues,
  `AppException` → its code, other `HttpException` → code by status (`errorCodeForStatus`), anything
  else → `INTERNAL_ERROR` without leaking the message. 5xx are logged with stack, 4xx as warnings,
  404 silently. The mapping is the pure function `toErrorBody` (unit-tested).
- Request id: `pino-http` `genReqId` reuses a sane client `x-request-id` (mobile app can pass one) or
  mints a UUID, echoes it as a response header and puts it in the envelope.
- Logging: `nestjs-pino`, pretty in development, JSON otherwise; `authorization`, `cookie`, `phone`,
  `password`, `code` redacted; `maskPhone()` for any phone we log ourselves.
- Health: `GET /health` is liveness (no dependencies, always 200). `GET /health/ready` is readiness
  (Terminus: Prisma `SELECT 1` + Redis `PING` with timeouts) and returns 503 in the error envelope
  with component details. Prisma and Redis clients never block boot; connection failures are logged
  and retried lazily.
- Config: `ConfigModule` with a zod `validate` (`src/config/env.ts`); defaults match
  `infra/docker-compose.yml` using `127.0.0.1` so a refused connection fails instantly.

## Consequences

- Clients translate `code` via i18n `errors.<code>` (a shared test guarantees every code has a string).
- Terminus' native body is wrapped in `details` when down; dashboards read `details.error`.
- API Jest scripts run with `--experimental-vm-modules` (Prisma 7 runtime uses dynamic `import()`).
