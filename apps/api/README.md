# @concr/api

NestJS 11 · Prisma 7 (PostgreSQL 16 + PostGIS) · Redis · zod · pino. All routes live under `/api/v1`,
Swagger UI at `/api/docs`, JSON at `/api/docs-json`.

```
npm run dev            # watch mode on :3000 (run from apps/api, or `npm run dev` at the repo root)
npm run test           # unit tests (*.spec.ts next to the code)
npm run test:e2e       # boots the app in-process: health, error envelope, swagger
npm run db:migrate     # prisma migrate dev  (needs docker compose up)
npm run openapi:export # docs/api/openapi.json
```

Conventions (see `docs/ADR/0003-*.md`): zod DTO via `createZodDto` → service → controller → test → Swagger;
throw only `AppException(code)` from `src/common/errors`; errors leave as
`{ statusCode, code, message, details?, requestId }`; every domain query is scoped by `supplierId`.
