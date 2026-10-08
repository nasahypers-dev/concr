# 0004. Mobile local storage: expo-secure-store until the EAS dev build

Date: 2026-10-08
Status: accepted

## Context

The spec names MMKV for local queues (GPS points, offline session). `react-native-mmkv` v3+ is a
native module that is **not** bundled in Expo Go, and Phase 0–1 must run in Expo Go so the owner can
test on a phone without an Apple/Google developer account.

## Decision

- Phase 0–1: session tokens live in `expo-secure-store` (Keychain / Keystore, included in Expo Go)
  through a zustand `persist` adapter (`src/store/secure-storage.ts`). Values are tiny (< 2 KB).
- Phase 2 (first EAS development build, needed anyway for maps, background location and push):
  add `react-native-mmkv` for the GPS point queue and other local caches; keep tokens in SecureStore.
- The session store exposes `hydrated` so the root layout can wait before routing.

## Consequences

- No native module is added in Phase 0; `npx expo start` + Expo Go is the whole mobile workflow.
- When MMKV arrives, README and the summary must state that `eas build --profile development` is
  now required (CLAUDE.md rule 8).
