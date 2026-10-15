---
name: concr-design-system
description: Visual foundation for the CONCR dispatcher web panel (apps/dispatch only) — Novxanı Beton brand tokens (graphite #12161F, amber #F0B252), Space Grotesk/Inter typography, spacing, radius, shadow, icon, status-colour, responsive and accessibility rules mapped to Next.js 16 + Tailwind 4 + shadcn base-nova (Base UI). Use before styling, theming, restyling or reviewing anything under apps/dispatch. Not for the mobile app or shared business logic.
paths:
  - 'apps/dispatch/**'
---

# CONCR design system — dispatcher panel

## Scope and status

- Applies to `apps/dispatch/**` only. The mobile app keeps `apps/mobile/src/ui/theme.ts`; business
  logic, API, GPS, MapLibre behaviour and order/delivery statuses are out of scope.
- **Phase 0 (2026-10-15): documented, not applied.** `apps/dispatch/src/app/globals.css` still holds
  the shadcn neutral defaults and `--concr-accent: #f5a623`. Phase 1 applies the tokens below (ADR
  0013). Until then, do not migrate "a little": new code uses the semantic classes that already exist
  (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-concr-primary`,
  `bg-concr-accent`) and never raw colours.
- Companions: `concr-dashboard-ui` (page and component recipes), `concr-ui-review` (checklist).
  Verified brand extraction, the Phase 1 mapping table and the contrast numbers:
  [reference/tokens.md](reference/tokens.md).

## Source of truth

1. Brand values were read from `https://novxanibeton.az` (`/static/css/main.<hash>.css`, `:root`) on
   2026-10-15 and approved by the owner as decision **D24** (`docs/DECISIONS.md`). Never invent a
   colour; anything not in D24 or the reference is a `TODO(nurlan)` placeholder.
2. Tokens are CSS variables in `globals.css` (`:root` + `@theme inline`). TSX never contains hex,
   rgb or oklch except the three allow-listed files in §1.
3. The supplier is data, not CSS: Novxanı Beton is the default theme, but no CSS or TSX may say
   "Novxanı". Supplier name and logo come from `useSupplier()` (`supplier.name`,
   `supplier.logoUrl`), the "CONCR" wordmark is the platform mark (D13, temporary).

## 1. Colour

### Brand palette (D24)

| Role             | Value     | Use                                                                 |
| ---------------- | --------- | ------------------------------------------------------------------- |
| Primary graphite | `#12161F` | sidebar, default (dark) buttons, text on amber, headings on dark    |
| Brand amber      | `#F0B252` | **the single accent**: primary action, active nav, focus ring, bars |
| Background       | `#F5F7FB` | page canvas                                                         |
| Surface          | `#FFFFFF` | cards, tables, dialogs, sheets, inputs                              |
| Text primary     | `#232B38` | body text                                                           |
| Text muted       | `#66728A` | secondary text, labels, placeholders (≥ 14 px, never on inset)      |
| Border           | `#E3E8F2` | hairlines, table rows, card and input borders                       |
| Success          | `#2FAF6A` | fills, dots, ≥ 18 px text                                           |
| Danger           | `#EF4444` | fills, dots, ≥ 18 px text; destructive actions                      |

Extended values verified on the site (hover/inset shades, not yet semantic): graphite 900 `#0D1117`,
amber 600 `#E09A35`, amber 700 `#B06F10`, inset `#EEF2F8`, steel `#5B8DEF`. Not decided
(`TODO(nurlan)`): warning and info tokens, the sidebar shade, small-text shades of success/danger.

### Semantic layer (Phase 1 target)

| Token (CSS variable)                 | Value            | Tailwind class examples                        |
| ------------------------------------ | ---------------- | ---------------------------------------------- |
| `--background` / `--foreground`      | canvas / text    | `bg-background`, `text-foreground`             |
| `--card` / `--popover`               | surface          | `bg-card`, `bg-popover`                        |
| `--muted` / `--muted-foreground`     | inset / muted    | `bg-muted`, `text-muted-foreground`            |
| `--border` / `--input` / `--ring`    | border / amber   | `border-border`, `ring-ring/50`                |
| `--primary` / `--primary-foreground` | graphite / white | `bg-primary` (default button)                  |
| `--concr-accent` / `-foreground`     | amber / graphite | `bg-concr-accent text-concr-accent-foreground` |
| `--destructive`, `--concr-danger`    | danger           | `text-destructive`, `bg-destructive/10`        |
| `--concr-success` (new)              | success          | `bg-concr-success`, `text-concr-success`       |
| `--concr-warning`, `--concr-info`    | `TODO(nurlan)`   | not available until decided                    |

Trap: shadcn's `--accent` is the **hover** surface used by menus and tabs, not the brand accent.
Brand amber is always `concr-accent`.

### Rules

- No raw colours in TSX (`#…`, `rgb(…)`, `oklch(…)`, `style={{ color }}`), no Tailwind palette
  classes (`bg-blue-50`, `text-amber-700`, `bg-green-50`, `text-gray-500` …). Use tokens.
- Allow-listed hex files: `src/components/status-badge.tsx` (`deliveryStatusColor`),
  `src/components/map/live-map.tsx` (marker SVG; MapLibre needs literal colours),
  `src/lib/pdf.ts` (pdfmake has no CSS). Values there change only with the owner.
- One accent. Amber marks the primary action and the active state; it is never a warning colour.
- Never white text on amber (contrast ≈ 1.9:1); amber surfaces get graphite text.
- Muted text only at ≥ 14 px and never on `bg-muted` (contrast ≈ 4.3:1 fails AA).
- Light status solids (grey, light blue, orange) get dark text, dark solids get white (§7).

## 2. Typography

- Families: **Space Grotesk** for headings (`font-heading`), **Inter** for everything else
  (`font-sans`), system stack as fallback. Weights: Space Grotesk 500/600/700, Inter 400/500/600.
- Loading is a Phase 1 decision (ADR 0013): `next/font/google` (built into Next, no dependency,
  needs network at build) or self-hosted woff2 in `apps/dispatch/public/fonts` via `next/font/local`.
  Phase 0 loads nothing. Before switching headings to Space Grotesk, verify it renders Ə/ə, Ğ/ğ,
  I/ı, Ö/ö, Ü/ü, Ç/ç, Ş/ş; if a glyph is missing, headings use Inter 600 with the same scale.
- Scale (size / weight / line-height / tracking) and the Tailwind spelling:

| Level   | Spec                              | Classes                                                       |
| ------- | --------------------------------- | ------------------------------------------------------------- |
| Display | 30 / 700 / 1.1 / −0.01em, tabular | `font-heading text-3xl font-bold tracking-tight tabular-nums` |
| H1      | 24 / 600 / 1.2 / −0.01em          | `font-heading text-2xl font-semibold tracking-tight`          |
| H2      | 16 / 600 / 1.3                    | `font-heading text-base font-semibold`                        |
| Body    | 14 / 400 / 1.5                    | `text-sm`                                                     |
| Strong  | 14 / 500                          | `text-sm font-medium`                                         |
| Meta    | 12 / 400–500 / 1.4, muted         | `text-xs text-muted-foreground`                               |
| Eyebrow | 12 / 600 / uppercase / 0.08em     | `text-xs font-semibold uppercase tracking-wider`              |
| Numbers | Inter, tabular, right-aligned     | `tabular-nums text-right`                                     |

- At most five sizes on one page; no orphan `text-lg`. KPI values use Display, not H1.
- Azerbaijani text is longer than English: never fix widths on labels; let chips wrap.

## 3. Spacing

- Scale (brand `--sp-*`): 4, 8, 12, 16, 24, 32, 48, 64 px → Tailwind `1 2 3 4 6 8 12 16`.
- Page padding `p-4 lg:p-6`; page header bottom `mb-6`; sections `gap-6`; cards inner 16 px
  (`--card-spacing`), compact cards 12 px; icon–text `gap-2`; chips `gap-1.5`; table cells `px-3`.
- Forms max width `max-w-2xl`; tables full width; dialogs sized by content (`sm:max-w-sm` → `-2xl`).

## 4. Radius

| Use                                             | Brand | Phase 1 class / variable     |
| ----------------------------------------------- | ----- | ---------------------------- |
| Controls: button, input, select, textarea, tabs | 6 px  | `rounded-sm` (`--radius-sm`) |
| Menus, popovers, tooltips, board blocks         | 10 px | `rounded-md` (`--radius-md`) |
| Cards, dialogs, sheets                          | 16 px | `rounded-lg` (`--radius-lg`) |
| Large panels, empty states                      | 24 px | `rounded-xl` (`--radius-xl`) |
| Badges, chips, avatars, map labels              | pill  | `rounded-full`               |

Phase 1 redefines `--radius-sm/md/lg/xl` once and swaps the classes inside the shadcn primitives in
one commit; until then the current classes stay (`rounded-lg` controls, `rounded-xl` cards).

## 5. Elevation, borders, focus, motion

- Shadows (brand): sm `0 1px 2px rgba(23,33,56,.06)`, md `0 6px 18px rgba(23,33,56,.08)`,
  lg `0 16px 42px rgba(23,33,56,.12)`, accent `0 8px 26px rgba(240,178,82,.28)`.
- Cards on the canvas: 1 px `border-border` + `shadow-sm`; menus and popovers `shadow-md`; sheets
  and dialogs `shadow-lg`; nothing casts a shadow inside a card; tables use borders only.
- Focus: amber ring, `focus-visible:ring-3 focus-visible:ring-ring/50` with `--ring` amber;
  visible on every interactive element, never removed.
- Motion: `cubic-bezier(0.22, 1, 0.36, 1)`; 180 ms for hover, chips, rows; 320 ms for sheets and
  dialogs; honour `prefers-reduced-motion` (also for the pulsing no-signal marker ring).

## 6. Iconography

- `lucide-react` only. Sizes: 16 (`size-4`) inline, tables, buttons; 20 (`size-5`) navigation and
  page-header actions; 24 (`size-6`) empty states. Default stroke width; colour inherits
  (`currentColor`).
- Decorative icons are `aria-hidden`; icon-only buttons carry an `aria-label` from i18n.
- No emoji, no inline SVG in TSX. The only custom graphics: map markers in `live-map.tsx` and the
  supplier logo from `supplier.logoUrl`. Navigation icons are fixed in `features/shell/nav.ts`.

## 7. Status colours

Owner-approved on 2026-10-15 and **not to be changed** by design work (values in
[reference/tokens.md §7](reference/tokens.md)): `deliveryStatusColor` (PLANNED `#9CA3AF`, ASSIGNED
`#60A5FA`, LOADING `#D97706`, EN_ROUTE `#F97316`, ARRIVED `#2563EB`, UNLOADING `#92400E`, COMPLETED
`#15803D`, CANCELLED `#6B7280`, FAILED `#DC2626`), the order/delivery tone maps, idle truck
`#9CA3AF`, plant `#12161F`, site pin `#F5A623`, no-signal ring `#DC2626`.

Integration plan (design only, no value changes, from Phase 2): one `STATUS_THEME` record per
status with `{ solid, soft, text }`. `solid` keeps today's hex and later becomes `--status-*` CSS
variables with identical values; `deliveryStatusColor` stays the exported hex map that
`live-map.tsx` and `board-page.tsx` read, so marker and board code does not move. `soft`/`text`
replace the Tailwind palette classes in `toneClass`. Badge anatomy is dot + label, never colour
alone; the board legend and the map legend read the same record; order statuses that mean the same
as a delivery status (IN_PROGRESS ↔ EN_ROUTE) share the hue.

## 8. Component consistency

- Density: desktop-dense. Buttons h-8 default, `size="sm"` (h-7) only inside tables and chip rows;
  inputs h-8; table rows 40–44 px; no "comfortable" and "compact" variants of the same screen.
- Exactly **one** primary action per view: `bg-concr-accent text-concr-accent-foreground`.
  Secondary `variant="outline"`, tertiary `ghost`, destructive in place as soft red
  (`variant="destructive"`), solid red only on the confirm button inside a confirmation dialog.
- `Card` groups related content; never one card per single line; tables sit in `Card` with `p-0`;
  no nested cards. `StatusBadge` for statuses; the `Badge` primitive is reserved for counts/tags.
- Forms: `Field` + `FieldLabel` + `FieldError`; `NativeSelect` for choices; `Switch` for booleans;
  react-hook-form + zod (already dependencies) for forms with three or more fields.
- Overlays: `Sheet` (right) to create/edit an entity, `Dialog` for decisions; mount only while open;
  success toast via `sonner`, errors as `Alert` inside the overlay.
- Shell: graphite sidebar with an amber active indicator; supplier logo + name at the top; the
  CONCR wordmark small at the bottom.
- Stack facts (shadcn `base-nova` on Base UI, not Radix): compose with `render={<Comp />}`, never
  `asChild`; state attributes are `data-open`/`data-closed`, `data-checked`, `data-active`,
  `data-starting-style`/`data-ending-style`, not `data-state`; a `DropdownMenuLabel` must sit inside
  `DropdownMenuGroup` (Base UI throws otherwise); `Button` wraps `@base-ui/react/button`; `cn` comes
  from the `cn` package (tailwind-merge compatible); Tailwind 4 syntax (`@theme inline`, `size-*`,
  `ring-3`, `data-*:` variants, `(--var)` arbitrary values).

## 9. Responsive

- Breakpoints: `md` 768 (minimum supported, spec §14), `lg` 1024, `xl` 1280, `2xl` 1536.
- 768–1023: icon-only sidebar (64 px), single column, tables scroll inside their card, dialogs
  `max-w-[calc(100%-2rem)]`.
- 1024–1279: sidebar 240 px; two-column grids on detail pages; live map and alerts stacked.
- ≥ 1280: side panels (live alerts 380 px, detail right column), KPI rows of 3–6.
- The board keeps its own minimum width (1100 px) and scrolls; hour columns never go below 36 px.
- Below 768 nothing is designed; it only must not overflow horizontally.

## 10. Accessibility

- Contrast AA: text 4.5:1, large text and UI parts 3:1 (numbers in the reference).
- Keyboard: every action reachable; dialogs trap focus and close on Escape (Base UI); rows that
  navigate contain a real link or button, a clickable `<tr>` alone is not enough.
- Semantics: `role="status"` for loading, `role="alert"` for errors, `aria-current="page"` for the
  active nav item, `aria-label` via i18n on icon-only controls, `sr-only` text next to colour
  swatches, `<html lang>` follows the locale.
- Hit areas ≥ 28×28 px with 4 px spacing in dense tables, ≥ 32×32 px elsewhere.
- Never colour alone: status = dot + label; alerts = icon + text.

## 11. Data-dense dashboard principles

- Hierarchy per page: `PageHeader` → filters and actions → primary data → secondary panels.
- Tables: sticky header, 40–44 px rows, no zebra, hover row, truncate with `title`, numbers
  right-aligned with `tabular-nums`, units in the header, at most 8–9 columns at 1280 px, visible
  sort state, "no data" and "no match" as different empty states.
- Freshness: polled data shows an "updated HH:mm" line or a live dot; spinners only on the first
  load (`isPending`), never on refetch (`isFetching`).
- Formatting only through `src/lib/format.ts`: dates `dd.MM.yyyy, HH:mm` in Baku time, money
  `formatMoney` ("1 298,00 ₼"), volume `formatVolume` ("12,5 m³"), phones `formatPhoneAz`.
- Status everywhere as dot + label; alerts sorted by severity; counts in the sidebar badge.

## 12. Multi-supplier readiness

Tokens are semantic (`--concr-*`, shadcn names); the Novxanı Beton values are only the default
`:root` theme. A future per-supplier theme overrides the same variables (for example a
`data-supplier-theme` attribute or inline style built from `supplier.theme`) without touching
components. Do not build it now (CLAUDE.md rule 4). Logo and name always come from supplier data.

## Phases (ADR 0013, status in `docs/PROGRESS.md`)

Phase 0 docs (done 2026-10-15) → Phase 1 tokens + fonts + status theme → Phase 2 shell + shared
components (`DataTable`, `KeyValue`, `ChipGroup`, `EntitySheet`) → Phase 3 pages (board and live
last) → Phase 4 polish (contrast, keyboard, 768/1024/1280, i18n, docs).
