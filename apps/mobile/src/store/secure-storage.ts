import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

/**
 * zustand persist adapter over expo-secure-store (Keychain / Keystore).
 * Used for session tokens until the EAS dev build brings MMKV in Phase 2 (ADR 0004).
 * SecureStore values are limited to 2 KB: keep persisted state tiny.
 */
export const secureStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};
