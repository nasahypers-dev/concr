# Progress

Phase plan: `docs/CONCR_SPEC.md` §19. Update this file at the end of every session.

## Phase 0 — Skeleton (done 2026-10-08)

- [x] git repo, npm workspaces, TypeScript base, ESLint 10 flat config, Prettier, EditorConfig, LF line endings
- [x] `packages/shared`: enums, error codes, zod schemas, i18n (az/ru/en) + key-parity and error-code tests
- [x] `infra/docker-compose.yml`: PostGIS 16 + Redis 7 with healthchecks
- [x] `apps/api`: NestJS 11, `/health` (liveness) + `/health/ready` (Terminus: Postgres + Redis), Swagger
      `/api/docs`, pino logger with request id, error envelope filter, zod validation pipe, Prisma 7 skeleton
      with the PostGIS extension migration, OpenAPI export to `docs/api/openapi.json`
- [x] `apps/mobile`: Expo SDK 57, Expo Router with `Stack.Protected` role routing, NativeWind 4, TanStack
      Query, zustand session in expo-secure-store, i18next over shared bundles, `(auth)/(customer)/(driver)`
      groups with stub screens, UI kit (Button, TextField, Screen, StateView)
- [x] `apps/dispatch`: Next.js 16, Tailwind 4, shadcn (Base UI), next-intl (cookie locale), login page with
      react-hook-form + shared zod schema, API client with envelope parsing
- [x] CI: GitHub Actions (format, lint, typecheck, unit tests, migrations, drift check, API e2e, builds)
- [x] Docs: README, SETUP_GUIDE, DECISIONS, ADR 0001–0005

### Definition of done — how it was verified

| DoD item                      | Evidence                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| API `/health` 200             | e2e test `apps/api/test/app.e2e-spec.ts` (5 tests) + `GET /api/docs-json` lists both health routes                                                |
| Expo Go shows "CONCR" welcome | `npx expo-doctor` 21/21 checks, `npx expo export --platform android` builds the bundle; **not yet opened on a phone** (owner to scan the QR code) |
| Login page opens              | `next build` renders `/login` as a dynamic route; 4 component tests for the form                                                                  |
| Green checks                  | `npm run lint && npm run typecheck && npm run test` → 61 tests green on Windows                                                                   |

### Not verified on this machine

- Docker Desktop is not installed here, so `docker compose up`, `prisma migrate dev` and `/health/ready` = 200
  were not exercised locally. CI runs them against service containers on the first push.
- The GitHub Actions workflow has not run yet (no remote). First push will tell.

### Known notices (harmless)

- API e2e prints "Jest did not exit one second after the test run" when Postgres/Redis are down: in-flight
  refused connections at shutdown. Disappears when the services run.

## Phase 1 — Auth + catalog + customer order + minimal dispatcher (next)

Prisma models + seed (real prices), OTP + staff auth, `SupplierScopeGuard`, catalog + quote + pricing
(pure, 100 % tests), sites, orders create/list/detail/cancel + order state machine, dispatcher inbox with
confirm/reject, mobile auth + 5-step wizard + order list/detail.

## Phase 2 — Driver app + live tracking (not started)

## Phase 3 — Push + documents + settings (not started)

## Phase 4 — Reports, aggregates, polish (not started)

## Phase 5 — Production (not started)
