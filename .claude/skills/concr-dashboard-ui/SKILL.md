---
name: concr-dashboard-ui
description: Page and component recipes for the CONCR dispatcher web panel (apps/dispatch) — shell, page header, filter bar, data tables, key-value cards, sheet editors, decision dialogs, KPI cards, planning board and live-map panel, loading/empty/error states, i18n keys, Baku-time formatting, TanStack Query hooks and RTL tests. Use when building, restyling or reviewing any panel page or feature component. Load concr-design-system first. Not for the mobile app.
paths:
  - 'apps/dispatch/**'
  - 'packages/shared/i18n/**'
---

# CONCR dashboard UI — how a panel page is built

Load `concr-design-system` first; this skill assumes its tokens and rules. Run `concr-ui-review`
after the change. Scope: `apps/dispatch` only. Business logic, API contracts, GPS, MapLibre
behaviour and status semantics stay in `@concr/shared` and are never changed from here.

## File map

```
src/app/(panel)/<page>/page.tsx      server component: generateMetadata + <FeaturePage />
src/features/<feature>/<page>.tsx    'use client' feature component (layout, states, dialogs)
src/features/<feature>/use-*.ts      TanStack Query hooks (keys in src/api/query-keys.ts)
src/features/common/                 use-supplier, use-duration, use-error-message
src/components/                      PageHeader, StateView, StatusBadge, NativeSelect, dialogs, map
src/components/ui/                   shadcn primitives (generated; one-off class edits only in Phase 1)
src/lib/format.ts · src/lib/pdf.ts   Baku time, money, volume, phone · pdfmake documents
packages/shared/i18n/{az,ru,en}.json panel.* keys, az first, all three files
```

## Page anatomy

1. Route file stays a thin server component (`generateMetadata` from `panel.nav.*`).
2. Feature component: `PageHeader` (title, optional subtitle, `meta` badge, `actions`, `backHref`),
   then content. Content width is the main area (`p-4 lg:p-6`), no inner max width for tables.
3. States are mandatory (CLAUDE.md rule 10): `isPending` → `LoadingRows` (or a table skeleton),
   `isError` → `ErrorState` with `onRetry`, empty → `EmptyState` with title + hint (+ action).
   Distinguish "no data" from "no match for these filters".
4. Everything user-visible comes from `useTranslations('panel.<area>')`; aria-labels and
   placeholders included. Typed keys: build label functions with a `switch` over the enum, not
   template strings.

## Recipes

### List / table page (orders, settings tabs, reports by product)

```
<PageHeader title actions={<Button variant="outline"><Download /> export</Button>} />
<Card size="sm" className="mb-4">  filters: search Input (md:max-w-sm), date Input (md:w-44),
                                   status chips (role="group"), ghost "clear" at the end
<Card size="sm"><CardContent className="p-0">
  <Table> sticky header · text left, numbers right (tabular-nums) · StatusBadge · row link/button
  pagination strip: border-t px-3 py-2 text-sm text-muted-foreground, prev/next outline sm
```

- One primary action at most (amber); exports and secondary actions are `outline`.
- Rows that open a record contain a `Link` on the identifier; the whole row may also be clickable.
- Keep page size and filter state in `useState`; put the date into the URL only when the page is
  shareable (board already does `?date=`).

### Detail page (order detail)

```
<PageHeader backHref backLabel title={number} meta={<StatusBadge />} actions={<Actions by status />} />
<div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
  left: 2×2 KeyValue cards (customer, site, product, schedule) · deliveries · timeline
  right: price breakdown · internal note
```

- Actions by status: the one state-advancing action is primary, reject/cancel are `destructive`
  (soft); each decision opens a dialog mounted only while open.
- Key-value rows: label `text-muted-foreground`, value `font-medium`, grid `grid-cols-[8rem_1fr]`.
  Until `KeyValue` exists (Phase 2), copy the `Row` pattern from `order-detail-page.tsx`, do not
  invent a third one.

### Editor sheet (trucks, drivers, products, pumps, trip)

```
<Sheet open onOpenChange={close}><SheetContent>
  <SheetHeader><SheetTitle>add / edit</SheetTitle></SheetHeader>
  <form> Field + FieldLabel + Input / NativeSelect / Switch / PasswordInput
         <Alert variant="destructive"> on mutation error
  <SheetFooter className="px-0"> primary submit (disabled while pending) · outline cancel
```

- Mount the sheet only while open so the form resets; `toast.success(tPanel('saved'))` on success
  and invalidate the query key; admin-only forms take `readOnly` and disable inputs + submit.
- Three or more fields or server validation → react-hook-form + zod schema from `@concr/shared`
  (pattern in `login-form.tsx`); otherwise `useState` is acceptable.

### Decision dialogs (confirm, reject, schedule, cancel)

- `ReasonDialog` for anything that needs a mandatory reason (min 3 chars), `ConfirmDialog` for
  yes/no, custom `Dialog` for multi-field decisions (confirm with pump fee, schedule with trips).
- Dialog width by content: `sm:max-w-sm` (reason), `sm:max-w-lg` (confirm), `sm:max-w-3xl`
  (schedule table). Destructive confirm button is the only solid red in the panel.

### KPI and report blocks

- KPI card: `Card size="sm"`, label `text-xs text-muted-foreground`, value Display scale
  (`font-heading text-3xl font-bold tabular-nums`), optional delta line. Rows of 3 at `xl`, 2 at `sm`.
- Bars: CSS only (`h-3 rounded-full bg-muted` track, `bg-concr-accent` fill), value printed at the
  end of the row; no chart library.
- Date range form: `Field` + `Input type="date"` pair, presets as a chip group, the start can never
  pass the end (`reports-page.tsx` already clamps).

### Planning board (`features/board`)

- Keep the placement math (`bakuMinutesOfDay`, `BLOCK_WIDTH`, `left/width` inline styles) and the
  data hooks untouched; style only the frame, lanes, header and block surface.
- Blocks: `rounded-md`, text contrast per the status rules (dark text on light solids), truncate
  order number + site; hover raises `brightness-110`; the now-line is `bg-destructive`.
- Legend reads `deliveryStatusColor`; never a second colour list.

### Live map panel (`features/live`)

- `LiveMap` props (`center`, `zoom`, `markers`, `polygon`, `className`) and marker painting in
  `live-map.tsx` are not a design surface: the MapLibre element's transform belongs to MapLibre,
  only the inner node is repainted when `visualKey` changes. Change marker SVG/CSS strings only with
  the owner, keep `SIZE`/anchor values.
- Layout: `xl:grid-cols-[1fr_380px]`, map card `h-[70vh] min-h-[420px] p-0`; right column: alerts
  (sorted late → concrete risk → no signal), trucks on shift (status dot + plate + driver), legend.
- Data: `useLive()` polls every 10 s and `subscribeLive` invalidates the query; do not add state
  outside the query cache.

### Inbox cards and settings tabs

- Inbox: one row/card per PENDING order, identifier + `StatusBadge` + waiting time, four facts
  (customer, site, product, schedule), total in Strong/Display, one primary "open" action. Facts are
  separate elements, never `·`-joined strings that truncate.
- Settings: `Tabs` with `TabsList className="flex-wrap"`, `initialTab` from the URL, read-only
  `Alert` for dispatchers, each tab = table + add button + editor sheet.

## Data and formatting rules

- Server state only in TanStack Query (`use-dispatch.ts`, `use-admin.ts`); keys from
  `src/api/query-keys.ts`; polling intervals (inbox 15 s, board 10 s, live 10 s) are product
  decisions, do not change them for visual reasons.
- UI state (`dialog`, `sheet`, filters) in component `useState`; session in the zustand store.
- Never format dates or money inline: `formatDate`, `formatDateTime`, `formatTime`, `formatWindow`,
  `formatMoney`, `formatVolume`, `formatPhoneAz`, `minutesSince` from `src/lib/format.ts`.
- Money is a string on the wire (`"110.00"`), volumes are numbers, dates ISO UTC; display is Baku
  time (UTC+4, no DST).

## i18n

- New keys go to `packages/shared/i18n/az.json`, `ru.json`, `en.json` (az first, same shape);
  nest under `panel.<area>`; reuse `status.*`, `states.*`, `common.*`, `errors.*`.
- Language names stay untranslated on purpose (`panel-shell.tsx`); everything else, including
  `aria-label`, `title`, `placeholder`, comes from `t()`.
- Azerbaijani strings are long: test layouts in `az`, not `en`.

## Responsive checks

768 (icon sidebar, single column, table scrolls in its card) · 1024 (sidebar open) · 1280 (side
panels, KPI rows) — verify all three in the browser before finishing; the board scrolls
horizontally by design.

## Tests

- RTL + jsdom with the mock client through `src/test/test-utils.tsx` (`renderWithProviders`), router
  mock in `src/test/router-mock.tsx`, polyfills in `jest.setup.js` (matchMedia, ResizeObserver;
  `maplibre-gl` is mocked, WebGL is never tested).
- Select by role/text from the `az` messages; inject `now` where the output depends on the clock
  (`InboxPage now={...}`); multiple matches → `getAllByText`.
- Every page change keeps or adds a test; `npm run lint && npm run typecheck && npm run test &&
npx prettier --check .` must be green before the commit.

## Do not

- Add dependencies (CSS-only bars, no chart/table/date libraries); add Radix APIs or `asChild`;
  write hex/palette classes in TSX; use inline `style` outside dynamic geometry; hard-code the
  supplier; put literal strings in TSX; touch `prisma/migrations`, `.env`, `@concr/shared` logic.
