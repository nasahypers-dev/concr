# @concr/dispatch

Next.js 16 App Router · Tailwind 4 · shadcn/ui (Base UI) · next-intl · TanStack Query · zustand ·
MapLibre GL. Dispatcher and supplier-admin panel, desktop-first, works at 768 px.

```
npm run dev -w apps/dispatch   # http://localhost:3001 (from the repo root; builds @concr/shared first with `npm run dev`)
npm run typecheck && npm run lint && npm test
npx shadcn@latest add <component>   # UI primitives land in src/components/ui
```

Copy `.env.example` to `.env`. `NEXT_PUBLIC_API_MODE=mock` (default) runs on the in-memory data from
`@concr/shared` (ADR 0011): a page reload rebuilds the fixtures, so changes made in the panel are gone
after a refresh. Locale comes from the `concr.locale` cookie (default `az`, switch in the top bar).

## Sign in (mock)

| Account    | E-mail                       | Password         | Can                                                |
| ---------- | ---------------------------- | ---------------- | -------------------------------------------------- |
| Dispatcher | `dispatcher@novxanibeton.az` | `Dispatcher123!` | inbox, orders, board, live map; settings read-only |
| Admin      | `admin@novxanibeton.az`      | `Admin123!`      | everything, including settings and drivers         |

Outside production the login page offers both as one-click fills. Passwords are dev placeholders
(spec §18); the real ones arrive with Phase B1.

## Pages (spec §14)

- `/inbox` — PENDING orders, newest first, with the waiting time; opens the order.
- `/orders/[id]` — customer, site, product, schedule, price, trips, timeline; actions by status:
  confirm (pump fee, price override, window change, each with a reason), reject, schedule (proposal
  starts with the largest mixer, editable), cancel (planned trips are cancelled too).
- `/orders` — history table with status chips, date, search, paging and a PDF export.
- `/board?date=` — mixer × hour board, click a trip to change mixer / driver / departure, "plan"
  for confirmed orders of the day.
- `/live` — MapLibre map (OpenFreeMap tiles, no key) with trucks, sites and the plant; alerts: late,
  concrete risk (75 of 90 min), no signal (> 2 min); refreshed by the tracker events and every 10 s.
- `/settings` — general parameters, products and prices, pumps, mixers, drivers (D22: drivers are
  created here with a password and sign in to the app with phone or e-mail + that password), service
  area polygon with a map preview.
- `/reports` — orders, delivered m³ and revenue for a date range (presets: today, this week, this month, last month, last 30 days; the start can never pass the end), by day and by grade, PDF export.

## Layout

```
src/app/            routes (server components: metadata + client feature component)
src/features/       feature UI + hooks (inbox, orders, board, live, settings, reports, shell, auth)
src/components/     StatusBadge, StateView, PageHeader, dialogs, NativeSelect, map/live-map
src/components/ui/  shadcn primitives (generated, keep edits minimal)
src/api/            ApiProvider (mock singleton), QueryClient, query keys
src/store/          zustand staff session persisted in localStorage
src/i18n/           next-intl request config over @concr/shared bundles, locale cookie
src/lib/            format (Baku time, money, volumes, report presets), pdf (pdfmake documents)
src/test/           render helpers and the next/navigation router mock for Jest
```
