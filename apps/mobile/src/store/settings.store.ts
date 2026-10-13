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
  /**
   * Names entered on the setup screen, by E.164 phone. The in-memory mock API forgets accounts
   * created at runtime on every reload; remembering the name on the device lets a repeat sign-in
   * skip the name screen. Harmless once the real backend stores the profile.
   */
  rememberedNames: Record<string, string>;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
  setTourDone: (done: boolean) => void;
  rememberName: (phone: string, fullName: string) => void;
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
      rememberedNames: {},
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
      setTourDone: (tourDone) => set({ tourDone }),
      rememberName: (phone, fullName) =>
        set((state) => ({ rememberedNames: { ...state.rememberedNames, [phone]: fullName } })),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ theme, locale, tourDone, rememberedNames }) => ({
        theme,
        locale,
        tourDone,
        rememberedNames,
      }),
      // Apply before the first paint: the root layout waits for `hydrated`.
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'system');
        applyLocale(state?.locale ?? defaultLocale);
        (state ?? useSettingsStore.getState()).markHydrated();
      },
    },
  ),
);
