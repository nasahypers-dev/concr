# 0011. Dispatcher panel: client-rendered data, local session, keyless map

Date: 2026-10-14
Status: accepted

## Context

Sprint U3 builds the dispatcher / supplier-admin panel (`apps/dispatch`, Next.js 16 App Router) on the
in-memory mock client from `@concr/shared` (ADR 0006), before the backend exists. The mock keeps its
state in memory, so it can only live in one JavaScript process; server components would each get
their own copy and never see what the browser changed.

## Decision

- **Data is fetched in the browser.** Route files under `src/app` are thin server components (metadata and
  a client feature component). Every feature page is a client component that reads through
  TanStack Query hooks over the `ApiClient` from `src/api/api-provider.tsx` (one mock singleton per
  tab; `NEXT_PUBLIC_API_MODE=http` will swap in the HTTP client in Phase B2 without touching pages).
- **Session in `localStorage`** (`src/store/session.store.ts`, zustand `persist`, key
  `concr.staff-session`): access/refresh tokens and the staff user. The `(panel)` layout is a client
  guard: no session → `/login`; while the store is still hydrating nothing flashes. Server-side
  protection (`proxy.ts`, httpOnly cookies) arrives with the real auth in Phase B1.
- **Locale by cookie** (`concr.locale`, ADR 0005): the top-bar switcher writes the cookie from the
  browser and calls `router.refresh()`; next-intl reads it on the server for the next render.
- **Map:** MapLibre GL with OpenFreeMap vector tiles (`https://tiles.openfreemap.org/styles/liberty`),
  no key, no account (ADR 0008), behind `src/components/map/live-map.tsx` (markers reconciled by id,
  polygon as a GeoJSON layer). It is loaded with `next/dynamic` and `ssr: false`; Jest mocks the
  component.
- **Forms:** native `<select>` (`src/components/native-select.tsx`) for every choice in forms (mixers,
  drivers, types) — keyboard friendly, trivial in jsdom; Base UI menus only for the top bar. Dialogs
  and sheets are mounted only while open, so their local state resets without effects.
- **Roles:** every staff role sees every page; writes on Settings need `SUPPLIER_ADMIN` (spec §2), the
  mock answers `FORBIDDEN` otherwise and the UI disables the edit controls with a notice.
- **Live feed:** the live map polls `dispatch.live()` every 10 s and additionally subscribes to the
  mock tracker's events (`subscribeLive`), invalidating the query on every event — the same shape the
  Socket.IO client will have.

## Consequences

- A page reload rebuilds the fixtures: everything the dispatcher changed in the mock is gone (the
  seeded staff session survives because the token encodes the user id). Documented in the README.
- The mobile app and the panel run separate mock stores; a trip driven on the phone is not visible on
  the panel until Phase B3 (real API + sockets).
- `next build` prerenders nothing with data; every route is dynamic.
