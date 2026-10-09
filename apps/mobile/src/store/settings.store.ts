import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from './secure-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export interface SettingsState {
  /** false until the persisted settings have been read from storage. */
  hydrated: boolean;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      theme: 'system',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ theme }) => ({ theme }),
      // Apply before the first paint: the root layout waits for `hydrated`.
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'system');
        (state ?? useSettingsStore.getState()).markHydrated();
      },
    },
  ),
);
