import { defaultLocale, type Locale } from '@concr/shared';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { initI18n } from '@/i18n';
import { secureStorage } from './secure-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export interface SettingsState {
  /** false until the persisted settings have been read from storage. */
  hydrated: boolean;
  theme: ThemePreference;
  /** UI language; Azerbaijani until the user picks another one in the profile (D19). */
  locale: Locale;
  /** The first-run guided tour was finished or skipped (per install). */
  tourDone: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
  setTourDone: (done: boolean) => void;
  markHydrated: () => void;
}

const SETTINGS_STORAGE_KEY = 'concr.settings';

/**
 * NativeWind forwards the preference to React Native's Appearance, so `dark:` classes,
 * `useColorScheme()`, the status bar and the navigators all follow it (ADR 0009).
 */
export function applyTheme(theme: ThemePreference): void {
  colorScheme.set(theme);
}

/** `initI18n` is idempotent: it initialises on first use and switches the language afterwards. */
export function applyLocale(locale: Locale): void {
  initI18n(locale);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      theme: 'system',
      locale: defaultLocale,
      tourDone: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
      setTourDone: (tourDone) => set({ tourDone }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ theme, locale, tourDone }) => ({ theme, locale, tourDone }),
      // Apply before the first paint: the root layout waits for `hydrated`.
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'system');
        applyLocale(state?.locale ?? defaultLocale);
        (state ?? useSettingsStore.getState()).markHydrated();
      },
    },
  ),
);
