---
name: concr-ui-review
description: Review checklist for UI changes in the CONCR dispatcher web panel (apps/dispatch) — design-token compliance (no hex or palette classes), typography scale, status-colour integrity, loading/empty/error states, accessibility, i18n (az/ru/en keys), responsive breakpoints, Base UI correctness, map/board invariants and test coverage. Use after any UI change under apps/dispatch, before the lint/typecheck/test gates, or when asked for a UI or design review of the panel.
argument-hint: '[page name or files under apps/dispatch]'
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git status *) Bash(git log *)
paths:
  - 'apps/dispatch/**'
---

# CONCR UI review — dispatcher panel

Read-only. Report findings; fix them only when the owner asked for fixes. Rules come from
`concr-design-system` and `concr-dashboard-ui`; this skill checks that they were followed.

## 1. Scope the review

- Argument given → review those files/pages; none → `git diff --name-only HEAD -- apps/dispatch
packages/shared/i18n` plus untracked files from `git status --porcelain -- apps/dispatch`.
- Read every changed TSX/CSS file fully. Note which page(s) it affects: inbox, orders, order detail,
  board, live, settings, reports, login, shell.

## 2. Automated checks (Grep, repo-relative paths, `apps/dispatch/src` unless stated)

| #   | Check                    | Pattern / rule                                                                                                                                              | Allowed exceptions                                                         |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A1  | Raw colours in TSX/TS    | `#[0-9A-Fa-f]{3,8}\b`, `rgba?\(`, `oklch\(` in `*.tsx`/`*.ts` (not tests)                                                                                   | `components/status-badge.tsx`, `components/map/live-map.tsx`, `lib/pdf.ts` |
| A2  | Tailwind palette classes | `\b(bg\|text\|border\|ring\|from\|to)-(slate\|gray\|zinc\|neutral\|stone\|red\|orange\|amber\|yellow\|green\|emerald\|blue\|sky\|indigo\|violet)-\d{2,3}\b` | none in new code; existing uses are Phase 1 debt, list them                |
| A3  | Inline styles            | `style=\{\{`                                                                                                                                                | dynamic geometry only (board `left/width`, bar widths, marker DOM)         |
| A4  | Literal UI strings       | `>[^<{]*[A-Za-zəğıöüçşƏĞİÖÜÇŞ]{3,}[^<{]*<` in JSX; `(aria-label\|placeholder\|title)="[A-Za-z ]+"`                                                          | language names in `panel-shell.tsx`, brand words "CONCR"                   |
| A5  | i18n completeness        | every new `panel.*` key exists in `az.json`, `ru.json`, `en.json` with the same shape                                                                       | —                                                                          |
| A6  | Radix leftovers          | `asChild`, `data-state=`, `@radix-ui`                                                                                                                       | none                                                                       |
| A7  | Type/lint hygiene        | `: any\b`, `as any`, `console\.`, `// @ts-`                                                                                                                 | none                                                                       |
| A8  | Size and weight scale    | `text-(lg\|4xl\|5xl)`, `font-(light\|black\|extrabold)`                                                                                                     | none; `text-lg` only with a written reason                                 |
| A9  | Radius/shadow off-scale  | `rounded-(none\|sm\|2xl\|3xl\|4xl\|\[)`, `shadow-(xl\|2xl\|\[)`                                                                                             | `rounded-none` on full-bleed map skeletons                                 |
| A10 | States present           | page components reference `isPending`/`isError` (or `LoadingRows`/`ErrorState`/`EmptyState`) for every `useQuery` they own                                  | hooks-only files                                                           |
| A11 | Query keys               | new `useQuery` keys defined in `api/query-keys.ts`; mutations invalidate the right keys                                                                     | —                                                                          |
| A12 | Status colour integrity  | `deliveryStatusColor`, `orderStatusTone`, `deliveryStatusTone` values unchanged vs `git diff`; `IDLE_COLOR/PLANT_COLOR/SITE_COLOR` unchanged                | owner decision recorded in `docs/DECISIONS.md`                             |
| A13 | Map invariants           | `live-map.tsx`: `SIZE`, anchors, `concr-marker` class, `visualKey`, `map.remove()` unchanged; no styling of the MapLibre element itself                     | —                                                                          |
| A14 | Supplier hard-coding     | `Novxan` in `apps/dispatch/src`                                                                                                                             | none (fixtures live in `@concr/shared`)                                    |
| A15 | Tests                    | changed page has a `*.test.tsx`; selectors use `az` messages; `now` injected where time matters                                                             | pure style-only diffs may keep the existing test                           |

## 3. Manual checks (open the page at 768, 1024 and 1280 px)

- [ ] One primary (amber) action per view; secondary outline, tertiary ghost, destructive soft, solid
      red only inside a confirmation dialog.
- [ ] Hierarchy: `PageHeader` → filters/actions → primary data → secondary panels; headings follow
      the scale (H1 24/600, H2 16/600, body 14, meta 12, KPI display 30/700).
- [ ] Loading shows a skeleton of the right shape; empty vs no-match differ; error offers retry.
- [ ] Status = dot/badge + label, never colour alone; board/map/legend use the same colours.
- [ ] Contrast: body 4.5:1, UI 3:1; no white on amber; no muted text on `bg-muted`; dark text on
      light status solids.
- [ ] Keyboard: Tab reaches every control in order, focus ring visible, Escape closes overlays,
      Enter submits, clickable rows contain a focusable element.
- [ ] Screen reader: `role="status"`/`"alert"`, `aria-current` on nav, `aria-label` on icon-only
      buttons (translated), `sr-only` next to swatches.
- [ ] Responsive: no horizontal page scroll (board scrolls inside its card only); sidebar icon
      mode at 768; side panels stack below 1280 without clipping.
- [ ] Azerbaijani layout: long labels wrap, chips wrap, nothing truncates important data (phone,
      plate, volume, money).
- [ ] Numbers: right-aligned, `tabular-nums`, formatted via `lib/format.ts` (Baku time, "₼", "m³").
- [ ] Polled pages: no spinner on refetch; freshness visible where it matters (live, board).
- [ ] Base UI composition: `render` prop, `data-open`/`data-closed`, `DropdownMenuLabel` inside a
      `DropdownMenuGroup`, overlays mounted only while open.
- [ ] Dialog/sheet widths match the recipe; forms with ≥ 3 fields use react-hook-form + zod.
- [ ] No new dependency, no business logic moved into the panel, no `@concr/shared` logic edited.
- [ ] Docs: `apps/dispatch/README.md` and `docs/PROGRESS.md` updated when a page's behaviour or
      structure changed; ADR for any technical choice (CLAUDE.md rule 15).

## 4. Report (reply in Azerbaijani to the owner, keep file paths and code in English)

```
Nəticə: <keçir | düzəliş tələb olunur> — <n> tapıntı (blocker/major/minor)

| # | Səviyyə | Fayl:sətir | Qayda (A1…/manual) | Problem | Təklif |
|---|---------|------------|--------------------|---------|--------|

Yoxlanılan səhifələr və breakpoint-lər: …
Phase 1 borcu (dəyişdirilməyib, siyahı): …
```

- Severity: **blocker** = business/status/map invariant broken, missing state, untranslated
  text, contrast failure on primary content; **major** = token or scale violation, a11y gap,
  missing test; **minor** = naming, spacing, duplication.
- Order findings by severity, then by file. Quote the current value and the expected value.
- End with the gate reminder: `npm run lint && npm run typecheck && npm run test && npx prettier
--check .`.
