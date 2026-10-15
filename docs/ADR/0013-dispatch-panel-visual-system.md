# 0013. Dispatcher panel visual system: brand tokens as project skills, phased redesign

Date: 2026-10-15
Status: accepted

## Context

The read-only UI/UX audit of `apps/dispatch` (2026-10-15) found a working but generic panel: the
shadcn `neutral` oklch palette is untouched (`--primary` ≈ `#2b2b2b`, not the brand graphite), the
brand tokens `--concr-primary`/`--concr-accent` appear only in the sidebar, `font-heading` resolves
to the same system stack as the body, status colours live in two unrelated systems (pastel Tailwind
palette classes for badges, owner-approved hex for the map and board), 24 hex literals sit in six
TSX/TS files, white text on light board blocks fails contrast, and every page repeats the same
label/value, table and sheet-editor patterns by hand. The public site `novxanibeton.az` exposes a
complete token set in its CSS (`:root`): graphite and amber scales, surfaces, text colours,
spacing, radius, shadows, motion and the fonts Space Grotesk + Inter. Its main amber is `#f0b252`,
while the panel and the mobile app use `#f5a623` (spec §22 Q11 was still open).

The owner wants a professional, data-dense dispatcher panel in the Novxanı Beton identity, without
touching API integrations, GPS, MapLibre marker behaviour, order/delivery statuses or business
logic, and without new dependencies. He switches between Windows and macOS, so anything that guides
the work must live in git (CLAUDE.md owner context).

## Decision

1. **Brand values come from the site, approved as D24** (`docs/DECISIONS.md`): graphite `#12161F`,
   amber `#F0B252` (replaces `#F5A623` in the web panel from Phase 1), background `#F5F7FB`, surface
   `#FFFFFF`, text `#232B38` / muted `#66728A`, border `#E3E8F2`, success `#2FAF6A`, danger
   `#EF4444`, headings Space Grotesk, body Inter. Warning/info tokens, the sidebar shade and
   small-text shades of success/danger are `TODO(nurlan)` until decided. The mobile theme is not
   changed by this ADR.
2. **The design system is documented as project skills**, committed under `.claude/skills/`
   so both machines and every session see the same rules:
   - `concr-design-system` — tokens, typography, spacing, radius, elevation, icons, status colours,
     component consistency, responsive and accessibility rules, multi-supplier readiness, with the
     verified extraction, the Phase 1 mapping table and contrast numbers in `reference/tokens.md`;
   - `concr-dashboard-ui` — page and component recipes (shell, header, tables, key-value cards,
     sheets, dialogs, KPI, board, live map), data/formatting/i18n/test rules;
   - `concr-ui-review` — automated grep checks + manual checklist + report format.
     All three are scoped with `paths: apps/dispatch/**` (plus `packages/shared/i18n/**` for the
     recipes) so they load only for panel work. `CLAUDE.md` keeps the short hard rules and points to
     the skills; long reference material stays in the skills (progressive disclosure).
3. **Tokens are CSS variables in `globals.css`**, exposed to Tailwind 4 through `@theme inline`,
   using the shadcn variable names for everything shadcn primitives read (`--background`,
   `--card`, `--border`, `--primary`, …) plus `--concr-*` for brand semantics (`accent`, `success`,
   `danger`, later `warning`/`info`). shadcn's `--accent` stays a hover surface; the brand accent is
   always `--concr-accent`. TSX never holds colour literals except `status-badge.tsx`
   (`deliveryStatusColor`), `map/live-map.tsx` (SVG markers) and `lib/pdf.ts` (pdfmake).
4. **Status colours do not change.** `deliveryStatusColor`, the order/delivery tone maps and the
   live-page marker constants are owner decisions (2026-10-15). From Phase 2 they are wrapped in one
   `STATUS_THEME` record (`solid` = today's hex, later identical `--status-*` variables; `soft` and
   `text` derived) that badges, board, map legend and alerts all read; `deliveryStatusColor` remains
   the exported hex map consumed by `live-map.tsx` and `board-page.tsx`, so marker and board code is
   untouched.
5. **Fonts** are loaded in Phase 1 either with `next/font/google` (no dependency, needs network at
   build, CI included) or self-hosted woff2 through `next/font/local` in `public/fonts`; the choice
   is recorded as an amendment here when made. Before Space Grotesk is used for headings its
   Azerbaijani glyph coverage (Ə, Ğ, I/ı, Ö, Ü, Ç, Ş) is verified; a missing glyph means headings
   fall back to Inter 600 on the same scale.
6. **Radius scale** follows the brand: 6 px controls, 10 px menus/blocks, 16 px cards and dialogs,
   24 px large panels, pill for badges. Phase 1 redefines `--radius-sm/md/lg/xl` once and swaps the
   classes in the generated shadcn primitives in the same commit (the only planned edit of
   generated files).
7. **Phases**, one PR each, gates green, no logic changes:
   - Phase 0 (this ADR): skills + docs, no code.
   - Phase 1: tokens, fonts, semantic status tokens, hex removed from TSX outside the allow-list,
     `pdf.ts` colours aligned.
   - Phase 2: shell split (Sidebar / TopBar / supplier brand), `DataTable`, `KeyValue`,
     `ChipGroup`, `EntitySheet`, table skeleton, `STATUS_THEME`.
   - Phase 3: pages re-laid out on the new components (inbox, orders, detail, settings, reports;
     board and live last, keeping `LiveMap` props and marker painting).
   - Phase 4: contrast/keyboard pass, 768/1024/1280 QA, az/ru/en check, README/PROGRESS, screenshots.
8. **Dark mode** is deferred: the site has none, `.dark` tokens stay in `globals.css` unused; a
   decision is taken in U4 together with ADR 0009 (mobile theme preference).

## Consequences

- Every styling task in the panel has one source of truth that travels with the repo; reviews can
  be mechanical (`concr-ui-review`), and the audit's "AI template" symptoms (default neutrals, flat
  type scale, three colour vocabularies, duplicated patterns) have a concrete fix path.
- The brand accent diverges between web (`#F0B252`) and mobile (`#F5A623`) until the owner decides
  for the app; both values are documented so nothing is invented.
- Phase 1 touches generated shadcn files once (radius classes), which the README's "keep edits
  minimal" allows as a deliberate, recorded change.
- Multi-supplier theming stays a variable override, not a component fork (rule 4: the door is
  open, nobody walks through it now).
- Risks to watch: the `cn` package's class-merge semantics when overriding primitive classes,
  Base UI (not Radix) attribute names, Next 16 API differences (`apps/dispatch/AGENTS.md`), build
  network access for Google fonts, and test selectors that depend on Azerbaijani wording.
