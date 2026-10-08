import { UserRole } from '@concr/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from './secure-storage';

export interface SessionTokens {
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

export interface SessionState {
  /** false until the persisted session has been read from secure storage. */
  hydrated: boolean;
  role: UserRole | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (tokens: SessionTokens) => void;
  clear: () => void;
  markHydrated: () => void;
}

const SESSION_STORAGE_KEY = 'concr.session';

/** Roles that use the mobile app; staff roles sign in on the web panel. */
const MOBILE_ROLES: readonly UserRole[] = [UserRole.CUSTOMER, UserRole.DRIVER];

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      role: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ role, accessToken, refreshToken }) => set({ role, accessToken, refreshToken }),
      clear: () => set({ role: null, accessToken: null, refreshToken: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ role, accessToken, refreshToken }) => ({ role, accessToken, refreshToken }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

export function selectIsAuthenticated(state: SessionState): boolean {
  return state.accessToken !== null && state.role !== null && MOBILE_ROLES.includes(state.role);
}
