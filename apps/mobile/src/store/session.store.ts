import { UserRole } from '@concr/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from './secure-storage';

export interface SessionTokens {
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  userId?: string | null;
  /** false when the account still lacks a name; the (setup) group collects it (D21). */
  profileComplete?: boolean;
}

export interface SessionState {
  /** false until the persisted session has been read from secure storage. */
  hydrated: boolean;
  role: UserRole | null;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  profileComplete: boolean;
  setSession: (tokens: SessionTokens) => void;
  markProfileComplete: () => void;
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
      userId: null,
      accessToken: null,
      refreshToken: null,
      // true by default so sessions persisted before D21 keep working.
      profileComplete: true,
      setSession: ({ role, accessToken, refreshToken, userId, profileComplete }) =>
        set({
          role,
          accessToken,
          refreshToken,
          userId: userId ?? null,
          profileComplete: profileComplete ?? true,
        }),
      markProfileComplete: () => set({ profileComplete: true }),
      clear: () =>
        set({
          role: null,
          userId: null,
          accessToken: null,
          refreshToken: null,
          profileComplete: true,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ role, userId, accessToken, refreshToken, profileComplete }) => ({
        role,
        userId,
        accessToken,
        refreshToken,
        profileComplete,
      }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

export function selectIsAuthenticated(state: SessionState): boolean {
  return state.accessToken !== null && state.role !== null && MOBILE_ROLES.includes(state.role);
}
