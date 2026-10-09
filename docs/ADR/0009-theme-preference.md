# ADR 0009 — Theme preference (system / light / dark)

Date: 2026-10-09 · Status: accepted

## Context

The owner wants a theme setting in the profile: follow the phone (default), or force dark or
light, remembered across restarts. The mobile app styles everything with NativeWind `dark:`
variants, and a few props that cannot take a className (icons, navigators, status bar, map) read
colours from `useThemeColors()` in `src/ui/theme.ts`, which was driven by the system scheme only.

## Decision

- **Engine:** NativeWind's `colorScheme.set('light' | 'dark' | 'system')`. It forwards to React
  Native's `Appearance.setColorScheme`, so every consumer follows one switch: `dark:` classes,
  `useColorScheme()` (and therefore `useThemeColors()`), `expo-status-bar` with `style="auto"`, the
  Expo Router stacks and `react-native-maps` (`userInterfaceStyle`). No theme context of our own.
- **Store:** `src/store/settings.store.ts` (zustand `persist`, key `concr.settings`, only `{ theme }`)
  on the existing `secureStorage` adapter. It is a 20-byte JSON value, well under the 2 KB SecureStore
  limit, and it keeps Expo Go compatibility (no new native module). The preference is applied inside
  `onRehydrateStorage` before `hydrated` flips, and the root layout waits for it, so the first frame is
  already themed (no flash).
- **Icons:** `Icon` gets a `tone` prop resolved through `useThemeColors()`; `color` stays as an explicit
  override for brand-fixed cases (map markers). `Button` derives its icon and spinner colour from the
  active palette, so the arrow on the amber primary button is dark in dark mode.

## Alternatives

- `@react-native-async-storage/async-storage` (bundled in Expo Go) for non-secret settings. Fine, but it
  adds a dependency for one key; switch to it if settings grow beyond a few flags.
- A React context + our own `isDark` flag: duplicates what NativeWind already does and would not reach
  `dark:` classes.

## Consequences

- `useThemeColors()` keeps using React Native's `useColorScheme()`; nothing else changes for callers.
- On Android, `Appearance.setColorScheme` maps to `AppCompatDelegate.setDefaultNightMode`; Expo's
  activity declares `uiMode` in `configChanges`, so no activity restart. Verify when Android is tested.
