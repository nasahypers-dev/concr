# CLAUDE.md — CONCR

Concrete ordering & delivery platform. Customer mobile app (Expo) + driver mode with live GPS tracking, dispatcher web panel (Next.js), NestJS API. First supplier: Novxanı Beton (novxanibeton.az, Baku/Absheron). Architecture is multi-supplier from day one.

**Full spec: `docs/CONCR_SPEC.md` — read it before any non-trivial task.** Business decisions: `docs/DECISIONS.md`. Architecture decisions: `docs/ADR/`. Phase status: `docs/PROGRESS.md`.

## Owner context
- Owner (Nurlan) knows React/TypeScript well; this is his **first mobile project**. Explain mobile-specific concepts briefly when they first appear (dev build vs Expo Go, native modules, background location, permissions).
- He works on **Windows on weekdays and macOS on weekends**. Every command you give must work on both (prefer cross-platform npm scripts; avoid bash-only one-liners in package.json — use `cross-env`, `rimraf`, Node scripts). Never rely on files outside git to carry state between sessions; `.env` is the only exception and is documented in `.env.example`.
- Reply to the owner in Azerbaijani unless he writes in English. Code, comments, commits, docs in English. UI strings only via i18n keys (az/ru/en).

## Repo layout
```
apps/mobile     Expo + Expo Router (customer + driver)
apps/api        NestJS + Prisma + PostgreSQL/PostGIS + Redis + Socket.IO + BullMQ
apps/dispatch   Next.js App Router + Tailwind + shadcn/ui
packages/shared enums, error codes, zod schemas, i18n JSON  (import as @concr/shared)
infra/          docker-compose (postgis, redis), scripts
docs/           spec, ADRs, decisions, progress, generated openapi.json
```
npm workspaces. Each app has its own package.json and .env.example.

## Commands
```
npm run dev            # api + dispatch
npm run dev:mobile     # expo start (apps/mobile)
npm run sim:driver     # fake driver moving a seeded delivery (test the live map without a truck)
npm run db:migrate | db:seed | db:reset
npm run lint && npm run typecheck && npm run test   # must be green before every commit
docker compose -f infra/docker-compose.yml up -d
```

## Hard rules
1. **Plan before code.** Anything touching more than 2 files: plan mode, get approval.
2. **Never invent business values** beyond what the spec gives (the 11 concrete prices M100–M600 in spec §4 and the contact details in §1 are real; everything marked `TODO(nurlan)` is not). Use placeholders with `// TODO(nurlan): ...` and list them in your summary.
3. **Every domain query is scoped by `supplierId`.** Staff endpoints go through `SupplierScopeGuard`. Nothing hard-codes "Novxanı" except `prisma/seed.ts`.
4. **No marketplace features in MVP.** Keep the door open; don't walk through it.
5. **State transitions only through** `orders/order-state.machine.ts` and `deliveries/delivery-state.machine.ts` — pure functions, 100% unit tests.
6. **Pricing only through** `modules/pricing/` pure functions. Prices are stored **excluding VAT**; VAT (`settings.vatRate`, 0.18) is added at the end. Delivery is included (fee 0). Order stores a pricing **snapshot**.
7. **Live tracking exactly per spec §9**: driver phone GPS via `expo-location` background task → MMKV queue → batched POST → validate/dedupe → Postgres + Redis → Socket.IO fan-out (throttle 5 s) → customer/dispatcher maps. GPS collected only while a delivery is EN_ROUTE/ARRIVED.
8. **Expo packages only via `npx expo install <pkg>`.** When you add a native module (maps, background location, notifications), state in README and in your summary that a development build (`eas build --profile development`) is now required and give the exact commands.
9. **i18n everywhere.** No literal user-facing strings in TSX. Keys in `packages/shared/i18n/{az,ru,en}.json` — all three, az first.
10. **Every screen has loading / empty / error states.** Every endpoint: zod DTO → service → controller → test → Swagger.
11. **Money** `Decimal` in DB, `string` on the wire ("110.00"), AZN. Dates ISO-8601 UTC. Phones E.164 `+994…`.
12. **Errors** `{statusCode, code, message, details, requestId}`; codes from `@concr/shared/error-codes`.
13. **Security:** OTP hashed + rate-limited; JWT secrets from env; refresh rotation; cross-supplier access → 404; location batches validated (accuracy, time order, max 500 points).
14. **Commits:** Conventional Commits, small and focused, green checks first.
15. **Unsure about a business decision → ask** (one concise question with options). **Unsure about a technical choice → decide, implement, write `docs/ADR/NNNN-title.md`.**
16. **Don't touch** real `.env` secrets, generated `ios/`/`android/` folders by hand, or existing `prisma/migrations` (always add a new migration).

## Conventions
- TypeScript strict; no `any`. Named exports. `kebab-case` files, `PascalCase` components, `camelCase` otherwise.
- API: thin controllers, logic in services, Prisma in repositories. DTOs in `dto/`; schemas shared via `@concr/shared` when the client needs them.
- Mobile: screens in `app/`, UI in `src/ui/`, feature hooks in `src/features/<feature>/`, API client in `src/api/`. Server state = TanStack Query; UI/session = Zustand; local queues = MMKV.
- Web: same split under `apps/dispatch/src/`. Server components by default.
- Tests next to code: `*.spec.ts` (api), `*.test.tsx` (mobile/web).
- Logging: pino, structured, `requestId`, phone numbers masked.

## End of every session
Run `npm run lint && npm run typecheck && npm run test`, update README + `docs/PROGRESS.md`, then a 5-sentence summary: built / skipped / `TODO(nurlan)` placeholders / risks / next step. Remind the owner to `git push` (he switches computers).
