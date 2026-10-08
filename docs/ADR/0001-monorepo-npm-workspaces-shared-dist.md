# 0001. Monorepo: npm workspaces, shared package built to dist

Date: 2026-10-08
Status: accepted

## Context

Three apps (Expo, NestJS, Next.js) and one shared package must share enums, error codes, zod schemas and
i18n JSON. Each app uses a different bundler (Metro, tsc/Nest CLI, Turbopack) plus Jest. Source-level
aliasing (`paths` to `packages/shared/src`) needs a different trick per bundler and per test runner.
The owner switches between Windows and macOS, so everything must work with plain npm.

## Decision

- One git repo, npm workspaces (`packages/*`, `apps/*`), no Turborepo/Nx for now.
- `@concr/shared` is compiled with `tsc` to `dist/` (CommonJS + `.d.ts`, i18n JSON copied) and
  consumed as an ordinary package through `package.json` `exports`.
- Root scripts always build shared first (`build:shared`), and `npm run dev` runs `tsc --watch` for it
  next to the API and the web panel.
- One React version is enforced for the whole tree with root `overrides` (Expo pins it exactly) so
  React Native never sees two copies.
- Expo-managed packages are installed only with `npx expo install`; all other versions are pinned
  explicitly (see ADR 0002).

## Consequences

- Any bundler resolves `@concr/shared` the same way; Jest needs no mapper.
- After changing shared code you must rebuild (the dev script watches; CI/`test` build first).
- Two Tailwind majors coexist (v3 for NativeWind in mobile, v4 for the web) in separate workspaces.
- Moving to Turborepo later is a root-script change only.
