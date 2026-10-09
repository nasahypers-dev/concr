# Progress

Spec: `docs/CONCR_SPEC.md`. On 2026-10-09 the order of work changed to **UI first on mock data,
backend afterwards** (`docs/DECISIONS.md` P1–P4, ADR 0006–0008). Update this file at the end of every session.

## Roadmap

| Sprint  | Scope                                                                                                                                                                           | Status                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Phase 0 | Monorepo skeleton: shared, API, mobile, web, infra, CI, docs                                                                                                                    | done 2026-10-08                        |
| **U1**  | Shared domain + fixtures + pricing + state machines, mock API client + live-tracking simulator, mobile design system, mock OTP sign-in, **all customer screens** incl. live map | done 2026-10-09 (device check pending) |
| U2      | Driver app: today list, delivery screen with big buttons, 90-min timer, photo completion (mock)                                                                                 | next                                   |
| U3      | Dispatcher web: app shell, inbox + order detail, orders table, planning board, live map (MapLibre), settings, reports (mock)                                                    | planned                                |
| U4      | Polish: dark mode, motion, accessibility, Azerbaijani typography, empty/error audit, screenshots                                                                                | planned                                |
| B1      | Prisma models + seed from the fixtures, auth, `SupplierScopeGuard`                                                                                                              | planned                                |
| B2      | catalog/quote/orders/sites endpoints, `HttpApiClient`, switch `API_MODE=http`                                                                                                   | planned                                |
| B3      | tracking ingestion + Socket.IO replaces the mock tracker, EAS dev build, background location                                                                                    | planned                                |
| B4+     | push, documents, settings, reports, production (spec Phases 3–5)                                                                                                                | planned                                |

## U1 — what was built (2026-10-09)

- `packages/shared`: domain types (`domain/`), integer-qəpik money helpers, geo helpers, `calculateQuote`
  (spec §10), order and delivery state machines (spec §8), fixtures = spec §18 seed as data
  (6 orders, one EN_ROUTE with a route), `ApiClient` contract, in-memory mock client with validation,
  scoping and state machines, `MockTracker`. 77 tests.
- `apps/mobile`: design system v1 (tokens, Inter, dark-mode aware components: Text, Button, Card,
  StatusBadge, Banner, Skeleton, ListRow, Stepper, SegmentedControl, QuantityStepper, Sheet,
  PriceBreakdown, Timeline, MapView, DateWindowPicker, AppHeader, Section, Scroll), API provider with
  `EXPO_PUBLIC_API_MODE=mock`, OTP sign-in on the mock client (code `123456`), typed query hooks,
  customer screens: home, 5-step order wizard (+ in-wizard new site), orders list with filters,
  order detail with live map / deliveries / price / documents / timeline / cancel / reorder,
  sites CRUD with map pin, profile with language switch and logout. 26 tests.
- Docs: ADR 0006–0008, DECISIONS P1–P4 + Q14, this roadmap.

### Verified

| Check                                               | Result                                                       |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `npm run lint && npm run typecheck && npm run test` | green: 77 + 15 + 5 + 26 tests                                |
| `npx expo export --platform android`                | bundles all screens (Metro + NativeWind + react-native-maps) |
| `npx expo-doctor`                                   | 21/21 checks pass (gesture-handler pinned to Expo Go's 2.32) |

### Not verified yet (needs the owner's phone)

- Expo Go on a device: welcome → OTP → home → wizard → order detail with the moving mixer marker.
- Map rendering in Expo Go on Android (Expo Go's bundled Google key) and iOS.

### Known gaps / notes

- No screen-level render tests yet (expo-router hooks need a test harness); component and hook tests exist.
- Reorder opens the wizard at the schedule step with the previous order prefilled.
- Dark mode tokens exist, but the dark palette is unpolished (U4).
- WSL is not installed on the Windows laptop, so Docker/Postgres were not run locally; irrelevant for U1–U4.

## Phase 0 — Skeleton (done 2026-10-08)

Monorepo, `@concr/shared` basics, NestJS API with health probes / Swagger / error envelope / Prisma 7
skeleton, Expo app skeleton, Next.js login page (disabled until B1), docker-compose, CI, ADR 0001–0005.
