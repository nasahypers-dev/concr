# Progress

Phase plan: `docs/CONCR_SPEC.md` §19. Update this file at the end of every session.

## Phase 0 — Skeleton (in progress, started 2026-10-08)

- [x] git repo, npm workspaces, TypeScript base, ESLint flat config, Prettier, EditorConfig
- [ ] `packages/shared`: enums, error codes, zod schemas, i18n (az/ru/en) + key-parity test
- [ ] `infra/docker-compose.yml`: PostGIS 16 + Redis 7
- [ ] `apps/api`: NestJS 11, `/health`, `/health/ready`, Swagger, pino logger, error envelope, zod validation, Prisma 7 skeleton with PostGIS extension
- [ ] `apps/mobile`: Expo SDK 57, Expo Router, NativeWind, TanStack Query, i18n, `(auth)/(customer)/(driver)` groups, 4 UI components
- [ ] `apps/dispatch`: Next.js 16, shadcn/ui, next-intl, login page
- [ ] CI: GitHub Actions (lint, typecheck, test, migrate check, e2e)
- [ ] Docs: README, SETUP_GUIDE, ADR 0001–0005
- [ ] DoD: `/health` 200 · Expo Go shows CONCR welcome · login page opens

## Phase 1 — Auth + catalog + customer order + minimal dispatcher (not started)

## Phase 2 — Driver app + live tracking (not started)

## Phase 3 — Push + documents + settings (not started)

## Phase 4 — Reports, aggregates, polish (not started)

## Phase 5 — Production (not started)
