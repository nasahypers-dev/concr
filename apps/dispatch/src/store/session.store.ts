import { UserRole } from '@concr/shared';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export interface StaffUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
}

export interface SessionState {
  /** false until the persisted session has been read from localStorage (client only). */
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: StaffUser | null;
  setSession: (session: { accessToken: string; refreshToken: string; user: StaffUser }) => void;
  clear: () => void;
  markHydrated: () => void;
}

const SESSION_STORAGE_KEY = 'concr.staff-session';

/** Server renders have no storage; hydration happens in <Providers> after mount. */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
      partialize: ({ accessToken, refreshToken, user }) => ({ accessToken, refreshToken, user }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        (state ?? useSessionStore.getState()).markHydrated();
      },
    },
  ),
);

export const selectIsAuthenticated = (state: SessionState): boolean => state.accessToken !== null;

/** Supplier admins own prices, fleet, drivers and reports (spec §2); dispatchers read them. */
export const selectIsAdmin = (state: SessionState): boolean =>
  state.user?.role === UserRole.SUPPLIER_ADMIN || state.user?.role === UserRole.PLATFORM_ADMIN;
