# CONCR

Concrete ordering & delivery platform. Customer mobile app (Expo) with a driver mode and live GPS tracking,
dispatcher web panel (Next.js), NestJS API. First supplier: Novxanı Beton (Baku / Absheron). Multi-supplier
architecture from day one.

- Full specification: `docs/CONCR_SPEC.md`
- Business decisions and open questions: `docs/DECISIONS.md`
- Architecture decisions: `docs/ADR/`
- Phase status: `docs/PROGRESS.md`
- Setup on Windows / macOS: `docs/SETUP_GUIDE.md`

## Layout

```
apps/mobile     Expo + Expo Router (customer + driver)
apps/api        NestJS + Prisma + PostgreSQL/PostGIS + Redis
apps/dispatch   Next.js App Router + Tailwind + shadcn/ui
packages/shared enums, error codes, zod schemas, i18n JSON  (import as @concr/shared)
infra/          docker-compose (postgis, redis), scripts
docs/           spec, ADRs, decisions, progress, generated openapi.json
```

## Commands (run from the repo root, work on Windows and macOS)

```
npm install
npm run docker:up        # PostGIS + Redis
npm run db:migrate       # Prisma migrations (apps/api)
npm run dev              # shared (watch) + api (:3000) + dispatch (:3001)
npm run dev:mobile       # Expo dev server (scan QR with Expo Go)
npm run lint && npm run typecheck && npm run test
npm run openapi:export   # writes docs/api/openapi.json
npm run docker:down
```

`npm run sim:driver` (fake driver moving a seeded delivery) arrives in Phase 2.

## Mobile: Expo Go is enough for now

Phase 0 and 1 run in Expo Go. A development build (`eas build --profile development`) becomes required in
Phase 2 when maps, background location and push notifications are added. See `docs/SETUP_GUIDE.md`.
