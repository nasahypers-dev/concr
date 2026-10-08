# 0005. i18n libraries: i18next (mobile), next-intl (web), shared JSON

Date: 2026-10-08
Status: accepted

## Context

All user-facing strings must come from `packages/shared/i18n/{az,ru,en}.json` (az first). Mobile and
web use different ecosystems: i18next is the standard in React Native, next-intl is the standard for
the Next.js App Router (server components, cookies). Their interpolation syntaxes differ by default
(`{{name}}` vs `{name}`).

## Decision

- Single source: the three JSON files in `packages/shared/i18n`, exported as typed `messages` with a
  `Messages` type derived from `az.json`. Mobile and web augment their library types with it, so
  `t('auth.login')` is checked at compile time in both apps.
- Interpolation uses single braces `{name}` everywhere; i18next is configured with
  `prefix: '{', suffix: '}'`. No ICU plural syntax in shared strings (next-intl would parse it,
  i18next would not); plural forms use separate keys when needed.
- Mobile: `i18next` + `react-i18next`, device locale from `expo-localization`, fallback `az`.
- Web: `next-intl` v4 without URL locale prefixes; locale from the `concr.locale` cookie, default `az`.
- Shared tests enforce identical key sets across the three files, no empty strings, single-brace
  placeholders only, and a translation for every error code.
- API: no user-facing strings; it returns `code`s that clients translate.

## Consequences

- Adding a key means editing all three JSON files (the test fails otherwise).
- next-intl and its ICU dependencies are ESM-only; they are listed in `transpilePackages` so both
  Next and `next/jest` handle them.
