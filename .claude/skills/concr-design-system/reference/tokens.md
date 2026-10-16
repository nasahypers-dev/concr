# Brand token reference — Novxanı Beton → CONCR dispatcher panel

Verified extraction from the public site, the current panel values, the Phase 1 mapping and the
contrast numbers behind the rules in `../SKILL.md`. Values marked **verified** were read from the
site's own CSS; values marked **owner** come from decision D24 (`docs/DECISIONS.md`); values marked
**proposal** are not decided and must stay `TODO(nurlan)` in code.

## 1. Source

- URL: `https://novxanibeton.az/`, stylesheet `/static/css/main.2c947a85.css` (`:root` block), read on
  2026-10-15. The hash changes when the site is rebuilt; re-verify before copying new values.
- `<meta name="theme-color" content="#12161f">` — matches `--concr-primary`.
- Assets: favicon `/branding/novxani-beton-favicon-v2-512.png` (512², dark graphite background, amber
  line drawing of buildings), logo `/NOVKHANI.svg` (500², every path `fill="#000000"` — a monochrome
  vector that can be recoloured), social image `/og-image.jpg` (1200×630, dark concrete photo, amber
  uppercase eyebrow "NOVXANI BETON", white bold title).
- The site has **no dark mode** (no `prefers-color-scheme`, no `.dark`).

## 2. Verified site tokens (`:root`)

| Group    | Variable                        | Value                                                                       |
| -------- | ------------------------------- | --------------------------------------------------------------------------- |
| Graphite | `--graphite-900`                | `#0d1117` (hero, footer)                                                    |
|          | `--graphite-800`                | `#12161f` (`--dark-bg`, theme-color)                                        |
|          | `--graphite-700`                | `#1a1f2b` (`--secondary-color`)                                             |
|          | `--graphite-600`                | `#232a38`                                                                   |
|          | `--graphite-500`                | `#2e3647` (ghost button border)                                             |
|          | `--graphite-400`                | `#3a4456`                                                                   |
| Amber    | `--amber-400`                   | `#f7c878`                                                                   |
|          | `--amber-500`                   | `#f0b252` (`--primary-color`, `--accent-color`)                             |
|          | `--amber-600`                   | `#e09a35` (`--primary-dark`, button text)                                   |
|          | `--amber-700`                   | `#b06f10`                                                                   |
|          | `--amber-glow`                  | `#f0b25247` (shadow / focus)                                                |
| Steel    | `--steel-500` / `-600` / `-400` | `#5b8def` / `#3f70d6` / `#8fb4f2` (5 uses, glow shadows only)               |
| Surfaces | `--bg-base`                     | `#f5f7fb` (body background)                                                 |
|          | `--bg-raised`, `--bg-card`      | `#ffffff`                                                                   |
|          | `--bg-inset`                    | `#eef2f8`                                                                   |
|          | `--border-color`                | `#e3e8f2`                                                                   |
| Text     | `--text-light`                  | `#232b38` (body colour)                                                     |
|          | `--text-muted`                  | `#66728a`                                                                   |
|          | `--text-dark`                   | `#1a1f2b`                                                                   |
|          | `--on-dark` / `--on-dark-muted` | `#f4f6fb` / `#f4f6fbd1`                                                     |
| Semantic | `--success` / `--danger`        | `#2faf6a` / `#ef4444`                                                       |
| Fonts    | `--font-head`                   | `"Space Grotesk", system-ui, sans-serif` (400–700 via Google Fonts)         |
|          | `--font-body`                   | `"Inter", system-ui, sans-serif` (300–700 via Google Fonts, `display=swap`) |
| Spacing  | `--sp-1` … `--sp-9`             | 4, 8, 12, 16, 24, 32, 48, 64, 96 px                                         |
| Radius   | `--r-sm` / `--r-md` / `--r-lg`  | 6 / 10 / 16 px (30 / 27 / 15 uses)                                          |
|          | `--r-xl` / `--r-pill`           | 24 px / 999 px                                                              |
| Shadows  | `--sh-sm`                       | `0 1px 2px #1721380f` (rgba(23,33,56,.06))                                  |
|          | `--sh-md`                       | `0 6px 18px #17213814` (rgba(23,33,56,.08))                                 |
|          | `--sh-lg`                       | `0 16px 42px #1721381f` (rgba(23,33,56,.12))                                |
|          | `--sh-amber`                    | `0 8px 26px var(--amber-glow)`                                              |
|          | focus                           | `0 0 0 3px var(--amber-glow)`                                               |
| Motion   | `--ease`                        | `cubic-bezier(0.22, 1, 0.36, 1)`                                            |
|          | `--t-fast` / `--t-med`          | `0.18s` / `0.32s`                                                           |

Component rules seen on the site (for flavour, not to copy literally):

- Headings: `font-family: var(--font-head); letter-spacing: -.01em; line-height: 1.15`; body
  `line-height: 1.6`.
- `.btn`: radius 6 px, Inter 600 15 px, padding 14/28, `.btn-primary` = white background + amber-500
  border + amber-600 text (an outline style); `.btn-ghost` = graphite-500 border.
- `.card`: white, 1 px `#e3e8f2` border, radius 16 px, `--sh-md`.
- `.header` scrolled: `#ffffffe6` + `backdrop-filter: blur(14px)` + border + `--sh-md`.
- `.hero-eyebrow`: uppercase 13 px, letter-spacing 3 px, amber-400 text, pill border `#f5a62366`.
- Gradients: `135deg, #12161f, #232a38 45%, #b97e2a 130%` (dark hero), `160deg, #fff, #fdf8ef` (warm card).
- `#f5a623` appears on the site only in translucent variants (`#f5a62366`, `#f5a62321`); the main
  amber is `#f0b252`. That is why D24 moves the panel accent to `#F0B252`.

## 3. Owner-approved panel palette (D24, 2026-10-15)

| Role             | Value     | Notes                                                               |
| ---------------- | --------- | ------------------------------------------------------------------- |
| Primary graphite | `#12161F` | sidebar, primary dark surfaces, headings on dark, accent foreground |
| Brand amber      | `#F0B252` | the single accent: primary action, active nav, focus ring, charts   |
| Background       | `#F5F7FB` | page canvas                                                         |
| Surface          | `#FFFFFF` | cards, tables, dialogs, sheets, inputs                              |
| Text primary     | `#232B38` | body text                                                           |
| Text muted       | `#66728A` | secondary text, labels, placeholders                                |
| Border           | `#E3E8F2` | hairlines, table rows, card borders, input borders                  |
| Success          | `#2FAF6A` | fills, dots, large text                                             |
| Danger           | `#EF4444` | fills, dots, large text; destructive actions                        |

Decided in Phase 1 (ADR 0013, amendment 1), derived from verified site values, not business values:
**warning** `#B06F10` (site amber-700) with text shade `#8C590D`, **info** `#5B8DEF` (site steel-500)
with text shade `#2554B1`, **success** text shade `#207949`, **danger** text shade `#C51111`, focus
ring `#B06F10`. The `-strong` text shades keep the hue and saturation of the solid and lower the HSL
lightness (30 % for success/warning, 42 % for danger/info) until the ratio on white and on the canvas
passes 4.5:1 (§6). Still open (`TODO(nurlan)`): the sidebar shade (kept `#12161F`), hover shades for
amber (site uses `#e09a35`), the mobile accent.

## 4. Values before Phase 1 (reference)

`apps/dispatch/src/app/globals.css` as it was after U3 (replaced on 2026-10-15):

| Variable                         | Current value                                       |
| -------------------------------- | --------------------------------------------------- |
| `--concr-primary`                | `#12161f`                                           |
| `--concr-accent`                 | `#f5a623` (`TODO(nurlan)` comment in the file)      |
| `--primary`                      | `oklch(0.205 0 0)` (shadcn neutral, ≈ `#2b2b2b`)    |
| `--background` / `--card`        | `oklch(1 0 0)`                                      |
| `--foreground`                   | `oklch(0.145 0 0)`                                  |
| `--muted` / `--muted-foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)`              |
| `--border` / `--input`           | `oklch(0.922 0 0)`                                  |
| `--ring`                         | `oklch(0.708 0 0)`                                  |
| `--destructive`                  | `oklch(0.577 0.245 27.325)`                         |
| `--radius`                       | `0.625rem` (sm 6, md 8, lg 10, xl 14 px derived)    |
| `--font-sans`, `--font-heading`  | system stack, identical                             |
| `.dark` block                    | shadcn defaults, never activated (no ThemeProvider) |

Mobile theme for comparison (`apps/mobile/src/ui/theme.ts`, **out of scope**, not to be changed by
the panel work): primary `#12161F`, accent `#F5A623`, background `#F6F7F9`, border `#E5E7EB`,
inkMuted `#6B7280`, info `#2563EB`, warning `#B45309`, danger `#DC2626`, success `#15803D`.

## 5. Phase 1 mapping (applied 2026-10-15)

| CSS variable                                    | Before Phase 1              | Now                                  | Why                                                                                    |
| ----------------------------------------------- | --------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `--background`                                  | `oklch(1 0 0)`              | `#F5F7FB`                            | brand canvas; cards get real contrast                                                  |
| `--foreground`                                  | `oklch(0.145 0 0)`          | `#232B38`                            | brand body text                                                                        |
| `--card`, `--popover`                           | `oklch(1 0 0)`              | `#FFFFFF`                            | surface                                                                                |
| `--card-foreground`, `--popover-foreground`     | `oklch(0.145 0 0)`          | `#232B38`                            |                                                                                        |
| `--primary`                                     | `oklch(0.205 0 0)`          | `#12161F`                            | brand graphite for default buttons, switch, checkbox                                   |
| `--primary-foreground`                          | `oklch(0.985 0 0)`          | `#FFFFFF`                            |                                                                                        |
| `--secondary`, `--muted`, `--accent`            | `oklch(0.97 0 0)`           | `#EEF2F8`                            | inset / hover surfaces (shadcn `--accent` is a hover colour, **not** the brand accent) |
| `--secondary-foreground`, `--accent-foreground` | `oklch(0.205 0 0)`          | `#232B38`                            |                                                                                        |
| `--muted-foreground`                            | `oklch(0.556 0 0)`          | `#66728A`                            | brand muted text                                                                       |
| `--border`, `--input`                           | `oklch(0.922 0 0)`          | `#E3E8F2`                            | brand hairline                                                                         |
| `--ring`                                        | `oklch(0.708 0 0)`          | `#B06F10`                            | focus indicator ≥ 3:1 (the accent amber is 1.9:1, the old grey 2.1:1)                  |
| `--destructive`                                 | `oklch(0.577 0.245 27.325)` | `var(--concr-danger-strong)`         | shadcn uses it for text and borders; the AA text shade keeps error text readable       |
| `--concr-primary`                               | `#12161f`                   | `#12161f` (unchanged)                |                                                                                        |
| `--concr-accent`                                | `#f5a623`                   | `#f0b252`                            | D24                                                                                    |
| `--concr-accent-foreground`                     | `#12161f`                   | `#12161f` (unchanged)                | white on amber fails contrast (§6)                                                     |
| `--concr-success` / `-strong` (new)             | —                           | `#2faf6a` / `#207949`                | `bg-concr-success`, `text-concr-success-strong`                                        |
| `--concr-danger` / `-strong` (new)              | —                           | `#ef4444` / `#c51111`                | brand danger for fills and dots; text uses the strong shade                            |
| `--concr-warning` / `-strong` (new)             | —                           | `#b06f10` / `#8c590d`                | site amber-700; distinct from LOADING/EN_ROUTE/UNLOADING status colours                |
| `--concr-info` / `-strong` (new)                | —                           | `#5b8def` / `#2554b1`                | site steel-500; distinct from ASSIGNED/ARRIVED status colours                          |
| `--shadow-sm/md/lg`, `--shadow-accent` (new)    | Tailwind defaults           | site `--sh-*` values                 | `shadow-sm` cards, `shadow-md` menus, `shadow-lg` sheets                               |
| `--font-sans`                                   | system stack                | `'Inter', …`                         | self-hosted subsets, `@font-face` + `unicode-range`                                    |
| `--font-heading`                                | = `--font-sans`             | `'Space Grotesk', var(--font-inter)` | per-glyph fallback to Inter (no Cyrillic in Space Grotesk)                             |
| `--chart-1` … `--chart-5`                       | greys                       | unchanged (unused)                   | reports bars use `bg-concr-accent`; revisit in Phase 3                                 |
| `--sidebar-*`                                   | shadcn neutrals (unused)    | unchanged (unused)                   | the sidebar reads `bg-concr-primary`; decide in Phase 2                                |
| `--radius`, `--radius-sm/md/lg/xl`              | 10 px → 6 / 8 / 10 / 14     | unchanged                            | scale moves with the primitive classes in Phase 2                                      |
| `.dark` block                                   | shadcn defaults             | unchanged, never activated           | ADR 0013 §8                                                                            |

Hex in TSX is still allowed only in `src/components/status-badge.tsx` (`deliveryStatusColor`),
`src/components/map/live-map.tsx` (marker SVG) and `src/lib/pdf.ts` (pdfmake has no CSS). Phase 1
touched no component, so the constants `IDLE_COLOR`, `PLANT_COLOR`, `SITE_COLOR` in `live-page.tsx`,
the graphite in `area-tab.tsx` and the 17 Tailwind palette classes (`status-badge.tsx`,
`inbox-page.tsx`, `live-page.tsx`, `order-detail-page.tsx`, `fleet-tabs.tsx`) remain as Phase 2 debt;
`pdf.ts` keeps `#12161F` / `#6B7280` / `#F3F4F6` until the PDF template is revisited.

## 6. Contrast (WCAG 2.x relative luminance, computed 2026-10-15)

| Foreground | Background | Ratio  | Verdict                                                        |
| ---------- | ---------- | ------ | -------------------------------------------------------------- |
| `#232B38`  | `#F5F7FB`  | ≈ 12.6 | AA/AAA body text                                               |
| `#66728A`  | `#FFFFFF`  | ≈ 4.9  | AA for 14 px text                                              |
| `#66728A`  | `#F5F7FB`  | ≈ 4.5  | AA, borderline — keep muted text ≥ 14 px                       |
| `#66728A`  | `#EEF2F8`  | ≈ 4.3  | **fails** AA — no muted text on inset                          |
| `#FFFFFF`  | `#12161F`  | ≈ 18   | AA/AAA                                                         |
| `#F0B252`  | `#12161F`  | ≈ 9.7  | AA/AAA — amber text/icons on graphite ok                       |
| `#12161F`  | `#F0B252`  | ≈ 9.7  | AA/AAA — amber buttons get graphite text                       |
| `#FFFFFF`  | `#F0B252`  | ≈ 1.9  | **fails** — never white on amber                               |
| `#FFFFFF`  | `#2FAF6A`  | ≈ 2.8  | fails for text; ok for dots/fills                              |
| `#FFFFFF`  | `#EF4444`  | ≈ 3.8  | ok for large text / UI, not for 14 px                          |
| `#EF4444`  | `#FFFFFF`  | ≈ 3.8  | small danger text uses `--concr-danger-strong` instead         |
| `#C51111`  | `#FFFFFF`  | ≈ 6.1  | danger strong — AA (5.7 on canvas, 5.1 on `bg-destructive/10`) |
| `#207949`  | `#FFFFFF`  | ≈ 5.4  | success strong — AA (5.0 on canvas)                            |
| `#8C590D`  | `#FFFFFF`  | ≈ 5.9  | warning strong — AA (5.5 on canvas)                            |
| `#2554B1`  | `#FFFFFF`  | ≈ 7.0  | info strong — AA (6.6 on canvas)                               |
| `#B06F10`  | `#FFFFFF`  | ≈ 4.1  | focus ring / warning solid — non-text 3:1 ok (3.8 on canvas)   |
| `#5B8DEF`  | `#FFFFFF`  | ≈ 3.2  | info solid — non-text 3:1 ok, not for text                     |
| `#B5B5B5`  | `#FFFFFF`  | ≈ 2.1  | the previous grey ring — **failed** 3:1                        |
| `#FFFFFF`  | `#9CA3AF`  | ≈ 2.5  | **fails** — PLANNED board blocks need dark text                |
| `#FFFFFF`  | `#60A5FA`  | ≈ 2.6  | **fails** — ASSIGNED board blocks need dark text               |
| `#FFFFFF`  | `#F97316`  | ≈ 2.8  | **fails** — EN_ROUTE blocks need dark text                     |

## 7. Status colours (owner-approved 2026-10-15, do not change)

`apps/dispatch/src/components/status-badge.tsx`:

| Delivery status | `deliveryStatusColor` | Badge tone | Meaning on the map / board |
| --------------- | --------------------- | ---------- | -------------------------- |
| PLANNED         | `#9CA3AF`             | neutral    | idle grey                  |
| ASSIGNED        | `#60A5FA`             | info       | light blue                 |
| LOADING         | `#D97706`             | warning    | amber-dark                 |
| EN_ROUTE        | `#F97316`             | accent     | orange — on the road       |
| ARRIVED         | `#2563EB`             | info       | blue — at the site         |
| UNLOADING       | `#92400E`             | warning    | brown — unloading          |
| COMPLETED       | `#15803D`             | success    | green                      |
| CANCELLED       | `#6B7280`             | neutral    | grey                       |
| FAILED          | `#DC2626`             | danger     | red                        |

Order statuses map to tones only: PENDING warning, CONFIRMED info, SCHEDULED info, IN_PROGRESS
accent, COMPLETED success, CANCELLED neutral, REJECTED danger. Live page constants: idle truck
`#9CA3AF`, plant `#12161F`, site pin `#F5A623`, no-signal ring `#DC2626`.

Future integration (design only, values stay): one `STATUS_THEME` record per status with
`{ solid, soft, text }`; `solid` keeps the hex above and later becomes `--status-<name>` CSS
variables with identical values; `deliveryStatusColor` remains the exported hex map that
`live-map.tsx` and `board-page.tsx` consume, so marker and block code does not change; `soft` and
`text` replace the Tailwind palette classes in `toneClass`; both legends read the same record.
