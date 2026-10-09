# CONCR

Concrete ordering & delivery platform. Customer mobile app (Expo) with a driver mode and live GPS tracking,
dispatcher web panel (Next.js), NestJS API. First supplier: Novxanı Beton (Baku / Absheron). Multi-supplier
architecture from day one. **Status: Phase 0 skeleton done** (see `docs/PROGRESS.md`).

- Full specification: `docs/CONCR_SPEC.md`
- Business decisions and open questions: `docs/DECISIONS.md`
- Architecture decisions: `docs/ADR/`
- Phase status: `docs/PROGRESS.md`
- Setup on Windows / macOS: `docs/SETUP_GUIDE.md`
- Generated API contract: `docs/api/openapi.json`

## Layout

```
apps/mobile     Expo + Expo Router (customer + driver)        → apps/mobile/README.md
apps/api        NestJS + Prisma + PostgreSQL/PostGIS + Redis  → apps/api/README.md
apps/dispatch   Next.js App Router + Tailwind + shadcn/ui     → apps/dispatch/README.md
packages/shared enums, error codes, zod schemas, i18n JSON  (import as @concr/shared)
infra/          docker-compose (postgis, redis), scripts
docs/           spec, ADRs, decisions, progress, generated openapi.json
```

## Commands (run from the repo root, identical on Windows and macOS)

```
npm install
npm run docker:up        # PostGIS + Redis (needs Docker Desktop)
npm run db:migrate       # Prisma migrations (apps/api)
npm run dev              # shared (watch) + api (:3000) + dispatch (:3001)
npm run dev:mobile       # Expo dev server; scan the QR code with Expo Go
npm run lint && npm run typecheck && npm run test
npm run openapi:export   # builds the API and writes docs/api/openapi.json
npm run docker:down
```

Copy each `.env.example` to `.env` (`apps/api`, `apps/mobile`, `apps/dispatch`). The mobile one needs your
laptop's LAN IP only once the real API is used, see `docs/SETUP_GUIDE.md`.

## Mock mode (current default)

The apps run on realistic in-memory data from `@concr/shared` fixtures (`EXPO_PUBLIC_API_MODE=mock`):
no backend, no Docker. Sign in with any phone number and the code `123456`, or use the dev quick-login
button on the welcome screen. The seeded customer has six orders, one of them with a mixer moving on the
live map. The backend is integrated in the B-phases (`docs/PROGRESS.md`).

`npm run sim:driver` (fake driver moving a seeded delivery) arrives in Phase 2.

## URLs in development

| What                             | URL                                       |
| -------------------------------- | ----------------------------------------- |
| API liveness                     | http://localhost:3000/api/v1/health       |
| API readiness (Postgres + Redis) | http://localhost:3000/api/v1/health/ready |
| Swagger UI                       | http://localhost:3000/api/docs            |
| Dispatcher panel                 | http://localhost:3001/login               |

## Mobile: Expo Go is enough for now

Phase 0 and 1 run in Expo Go. A development build (`eas build --profile development`) becomes required in
Phase 2 when maps, background location and push notifications are added. See `docs/SETUP_GUIDE.md`.

## Conventions

See `CLAUDE.md` (hard rules) and `docs/ADR/` (why things are the way they are). Short version: TypeScript
strict everywhere, zod at every boundary, every string through i18n keys (az/ru/en), every domain query scoped
by `supplierId`, money as decimal strings, dates ISO-8601 UTC, Conventional Commits with green checks.
