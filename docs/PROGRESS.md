# Progress

Spec: `docs/CONCR_SPEC.md`. On 2026-10-09 the order of work changed to **UI first on mock data,
backend afterwards** (`docs/DECISIONS.md` P1–P4, ADR 0006–0008). Update this file at the end of every session.

## Roadmap

| Sprint  | Scope                                                                                                                                                                           | Status                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Phase 0 | Monorepo skeleton: shared, API, mobile, web, infra, CI, docs                                                                                                                    | done 2026-10-08                                     |
| **U1**  | Shared domain + fixtures + pricing + state machines, mock API client + live-tracking simulator, mobile design system, mock OTP sign-in, **all customer screens** incl. live map | done 2026-10-09, device-checked on iPhone (Expo Go) |
| U2      | Driver app: today list, delivery screen with big buttons, 90-min timer, photo completion (mock)                                                                                 | done 2026-10-14 on mock data (foreground GPS only)  |
| U3      | Dispatcher web: app shell, inbox + order detail, orders table, planning board, live map (MapLibre), settings, reports (mock)                                                    | done 2026-10-14 on mock data                        |
| U4      | Polish: dark mode, motion, accessibility, Azerbaijani typography, empty/error audit, screenshots                                                                                | planned                                             |
| B1      | Prisma models + seed from the fixtures, auth, `SupplierScopeGuard`                                                                                                              | planned                                             |
| B2      | catalog/quote/orders/sites endpoints, `HttpApiClient`, switch `API_MODE=http`                                                                                                   | planned                                             |
| B3      | tracking ingestion + Socket.IO replaces the mock tracker, EAS dev build, background location                                                                                    | planned                                             |
| B4+     | push, documents, settings, reports, production (spec Phases 3–5)                                                                                                                | planned                                             |

## U3 — dispatcher panel (done 2026-10-14, mock data)

Built in one go after the owner asked to use the panel at once (D22 was decided the same day).

- **Shared:** `DispatchApi` (inbox/orders, confirm with pump fee / price override / window change,
  reject, `suggestPlan` + `schedule`, cancel, `reassignDelivery`, `board`, `live` with the §9.4
  alerts, `subscribeLive`), `AdminApi` (products, pumps, trucks, drivers per D22, supplier settings,
  service area, report summary), pure `planDeliveries` (largest mixer first, spec §8.1),
  `USER_INACTIVE` error code (deactivated accounts get no token and are signed out on mobile).
  Mock scoped to the supplier, staff-only, writes on admin endpoints for supplier admins. 103 tests.
- **Web (`apps/dispatch`):** mock login with one-click dev accounts, session in localStorage with a
  client guard, sidebar + top bar (inbox badge, language cookie switcher, user menu), inbox, order
  detail with all four decisions as dialogs, orders table with chips / date / search / paging / CSV,
  planning board (mixer × hour, click-to-edit, plan confirmed orders), live map (MapLibre +
  OpenFreeMap, trucks / sites / plant, late / concrete-risk / no-signal panel, tracker events + 10 s
  polling), settings tabs (general, products, pumps, mixers, drivers, service area with map preview),
  reports (summary, by day, by grade, CSV). Native selects in forms, dialogs mounted only while open.
  20 tests. ADR 0011.
- **Not done:** drag-and-drop on the board (click-to-edit instead), server-side route protection
  (Phase B1), Google Maps (needs the key, ADR 0008), U2 step 3 (driver trip screen).

## U2 — driver mode (in progress, 2026-10-14)

Three steps, one commit each; the owner approves each step before the next starts.

1. **Shared driver API** (done): `DriverApi` (`me`, `setShift`, `listDeliveries`, `getDelivery`,
   `setStatus`, `pushLocations`, `complete`) with zod schemas, a mock scoped to the signed-in driver, status
   changes through the delivery state machine, GPS batches validated per spec §9.2, handover documents numbered
   like the fixtures, and a tracker that leaves driver-operated trips alone. ADR 0006 addendum.
2. **Today screen, driver profile, dev login** (done): shift switch with the assigned mixer, today's trips as
   cards (trip n/N, order number, site, grade and m³, window, departure countdown / ETA / completion time),
   tomorrow's preview, pull-to-refresh, loading / empty / error states; profile with mixer, shift, language,
   appearance (`PreferenceSections`, shared with the customer profile), "call the dispatcher", logout;
   "DEV: enter as driver" on the welcome screen (Rauf, `+994500000012`). The trip route exists as a
   placeholder (header + facts) so taps already navigate. 8 tests.
3. **Trip screen** (done 2026-10-14): 56 px status buttons with haptics (loading → departed → arrived →
   unloading → complete), concrete timer from departure (shared `concreteTimer`, warning at 75, expired at 90),
   site contact + call, navigation sheet (Apple Maps / Google Maps / Waze universal links), "problem" → FAILED
   with a reason, handover act sheet (receiver name + up to 3 photos via expo-image-picker), foreground GPS
   batches while EN_ROUTE / ARRIVED (ADR 0012), times list and the act after completion. 5 tests.
   Fixture plates are now random placeholders (owner, 2026-10-14).

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
- Dark mode: badges, banners, chips and highlighted rows now have dark pairs (`*-soft-dark` + `*-light`); a full dark-palette pass is still U4.
- WSL is not installed on the Windows laptop, so Docker/Postgres were not run locally; irrelevant for U1–U4.

### Device check fixes (2026-10-09, iPhone / Expo Go)

- Dark mode: `Text` got a `none` tone so badge/chip/button colours set via className are no longer
  overridden by the default ink colour; soft backgrounds have `dark:` pairs (status badge, banner,
  highlighted delivery row, default-site badge, selected pump row, StateView error).
- Slump: the wizard explains the choice in customer language (`wizard.slumpIntro`, `wizard.slumpP2..P4`).
- Price preview on the product step is computed locally with `calculateQuote` (no mock round trip per tap);
  mock latency lowered to 200 ms.
- Payment methods: CASH and CARD only (D8 updated).
- Delivery date: customers can pick any day within the next 30 days (`DEFAULT_DAYS_AHEAD`).
- Pumps: 24/28/32/36/38/42 m with per-order prices 200/250/250/300/350/400 ₼ (Q2 answered); the pump step
  shows the price per option and the quote includes it.
- "Call the plant" dials the order line `+994 50 326 03 43` (`Supplier.dispatchPhone`, D14).
- The "too large top-right icon" turned out to be Expo Go's floating developer button, not part of the app.
- A persisted session whose user no longer exists in the rebuilt mock store now signs out (UNAUTHORIZED →
  login) instead of leaving every screen in an error state.

### Sprint U1.2 — third device test, 10 owner items (2026-10-12)

Five commits, each green locally and in CI:

1. Phone fields carry a fixed "+994" and take the 9 local digits (`PhoneField`, `src/lib/phone.ts`); the app
   starts in Azerbaijani on every device and the profile language choice is persisted (D19, D20);
   `expo-localization` removed.
2. A brand-new OTP account must enter name and surname in the new `(setup)` group before the app opens
   (`profileComplete` in the session, D21); the customer's own number is shown next to the site contact on
   cards, detail and review.
3. Site form screens use native keyboard insets so the tapped field rises above the keyboard (ADR 0010).
4. Location picker: confirm enables by distance from the start centre (Apple Maps has no gesture flag);
   a confirmed point is reverse-geocoded into the address field unless the customer typed one; site name
   hint ("Obyektin adı").
5. First-run guided tour on the home screen (three steps with arrows and a Skip button, per install,
   "App walkthrough" row in the profile replays it); lead time 2 h (temporary, Q1).

Follow-ups (2026-10-13): the tour replays on every sign-in and sits inline next to the order button / above the
tab bar (no measuring); single-marker maps zoom to street level instead of grey tiles; addresses come from
Nominatim in the app language (Apple geocoder as fallback).

Device checks pending on the iPhone: tour geometry on the real screen, keyboard insets on the site form,
geocoding text quality (Apple returns the phone's language), "+994" autofill behaviour.

### Sprint U1.1 — second device test, 25 owner items (2026-10-09)

Five commits, all green in CI:

1. Pricing: VAT on the concrete only, pump fee added untaxed (D15); minimum order 8 m³ (Q1); "Pompa"
   wording (D16); grade caption without "+ ƏDV"; night hint, tagline and the empty "documents" state removed;
   handover acts shown only when an order has one (D18).
2. Slump optional (dispatcher confirms), site contact phone required and frozen on the order
   (`siteContactName/Phone`, shown on cards, detail and review); default-site feature removed (D17).
3. Theme preference System/Dark/Light in the profile (ADR 0009); `Icon` tones and palette-aware button
   icons fix the invisible "+" / arrow / logout icons in dark mode.
4. Keyboard closes on tap outside and on drag; "Yadda saxlanıldı" auto-hides (6 s / tab switch); visual-only
   card form behind "Kartla".
5. Bolt-style site picker (centre pin, full-screen modal) with "use my location" (`expo-location`,
   foreground, Expo Go); markers no longer turn into the default pin on tap.

Device checks still pending on the iPhone: marker tap, picker gestures, GPS permission flow, theme switch
persistence after a cold start, keyboard dismissal on every form.

### CI (2026-10-09)

- First push to GitHub (`nasahypers-dev/concr`) went through; the workflow is green after four fixes:
  Prettier on two docs, `lint` builds `@concr/shared` first, `build` no longer wipes `dist`, and the
  Redis readiness probe waits for an in-flight connect (e2e expects 200 with the CI services).

## Phase 0 — Skeleton (done 2026-10-08)

Monorepo, `@concr/shared` basics, NestJS API with health probes / Swagger / error envelope / Prisma 7
skeleton, Expo app skeleton, Next.js login page (disabled until B1), docker-compose, CI, ADR 0001–0005.
