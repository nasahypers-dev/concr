# 0006. Shared domain layer and swappable API client (mock-first UI)

Date: 2026-10-09
Status: accepted

## Context

The owner decided to build the user interfaces first, on realistic data, and to integrate the
backend later (no real customer data yet, long-running project, UI quality is the priority). The
apps still need a stable contract so that the backend can be plugged in without rewriting screens.

## Decision

- `packages/shared/src/domain/*` holds the TypeScript domain types (money as string, dates as
  ISO-8601 UTC, enums from `enums.ts`). They become the API DTOs.
- `packages/shared/src/api/api-client.ts` defines `ApiClient` (`auth`, `catalog`, `sites`,
  `orders`, `tracking`). Every implementation throws `ApiClientError(code)` for business errors and
  `NetworkError` for transport failures; the UI translates `code` via `errors.<code>`.
- `packages/shared/src/api/mock/` is an in-memory implementation over `createFixtures()`: it
  validates with the shared zod schemas, prices with `calculateQuote`, enforces the state machines,
  scopes data by the signed-in user (cross-customer access → `NOT_FOUND`) and simulates latency.
  `MockTracker` moves EN_ROUTE deliveries along a route every 5 s, auto-arrives, unloads, completes
  and promotes the order, standing in for the Socket.IO stream of spec §9.
- Apps select the implementation from env (`EXPO_PUBLIC_API_MODE` / `NEXT_PUBLIC_API_MODE`:
  `mock` by default until Phase B2, `http` later). TanStack Query hooks only ever see `ApiClient`.
- Fixtures contain only spec-given business values (prices, VAT, contact, plant coordinates);
  everything else is a labelled `TODO(nurlan)` placeholder (see `docs/DECISIONS.md`).

## Consequences

- Screens, hooks and tests are written once; Phase B2 adds `HttpApiClient` and flips the env.
- The fixtures double as the Phase B1 seed and the mock client's tests double as contract tests
  for the real API.
- The mock lives in `@concr/shared`, so it ships in the bundle; it is tree-shaken out once the
  apps stop importing it (B2).
