# 0002. Dependency version pins for Phase 0

Date: 2026-10-08
Status: accepted

## Context

"Latest" on npm on 2026-10-08 was not always the safe choice: TypeScript 7 (new native compiler), NestJS 12
with ESM-only companion packages, Prisma 8 release candidates, NativeWind 5 RC. Tooling peers lag.

## Decision

| Area       | Pin                                                                                        | Reason                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | `~5.9.3` (root, api, dispatch); `~6.0.3` in mobile only                                    | typescript-eslint supports `<6.1`, ts-jest `<7`; Expo SDK 57 pins TS 6 itself                                                                 |
| NestJS     | `^11.x` with `@nestjs/config@4`, `@nestjs/terminus@11`, `@nestjs/swagger@11`               | `nestjs-zod@5` peers Nest 10/11; the Nest 12 line of config/terminus is ESM-only and cannot be loaded by Jest/ts-jest (CommonJS)              |
| Prisma     | `7.10.0` client + CLI + `@prisma/adapter-pg`                                               | 8.x is RC; Prisma 7 needs `prisma.config.ts`, a driver adapter and `importFileExtension = ""` for ts-jest                                     |
| Expo       | SDK 57, packages via `npx expo install`                                                    | Expo Go on the store supports SDK 57                                                                                                          |
| Next.js    | `16.4.0` + `next-intl@4` + shadcn 4 (Base UI)                                              | latest stable; `cacheComponents` off (fully dynamic panel)                                                                                    |
| NativeWind | `4.2.7` + `tailwindcss@3.4` in mobile, Reanimated 4 + `react-native-worklets`              | NativeWind 5 is RC; Expo 57 requires worklets with Reanimated 4                                                                               |
| Jest       | `~29.7.0` everywhere, `ts-jest@29`, `jest-expo@57`                                         | one Jest major across workspaces; API tests run with `--experimental-vm-modules` for Prisma's dynamic import                                  |
| ESLint     | `^10` flat config, `typescript-eslint@8`, `eslint-config-expo@57`, `eslint-config-next@16` | ESLint 9 is end-of-life; `eslint-plugin-react` needs `settings.react.version` set because its auto-detection uses an API removed in ESLint 10 |
| ioredis    | `^5`                                                                                       | 6.x is a fresh major; BullMQ (Phase 2) bundles its own                                                                                        |
| zod        | `^4.6`                                                                                     | shared by all apps; `nestjs-zod@5` supports zod 4                                                                                             |

## Consequences

- Upgrades are deliberate: bump one row at a time, run `npm run lint && npm run typecheck && npm run test`.
- Revisit NestJS 12 when nestjs-zod supports it; Prisma 8 when it is stable; NativeWind 5 when released.
- `@nestjs/platform-socket.io` must be installed at `@11` in Phase 2 (its latest requires Nest 12).
