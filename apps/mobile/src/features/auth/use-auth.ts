import type {
  AuthSession,
  DriverLoginInput,
  OtpRequestInput,
  OtpVerifyInput,
  UpdateProfileInput,
} from '@concr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';
import { selectIsAuthenticated, useSessionStore } from '@/store/session.store';
import { useSettingsStore } from '@/store/settings.store';

/** Mock OTP (spec §18). The mock API also returns it as `devCode`. */
export const DEV_OTP_CODE = '123456';
/** Seeded customer of the mock data (tests). */
export const DEV_CUSTOMER_PHONE = '+994500000001';

export function useRequestOtp() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: OtpRequestInput) => api.auth.requestOtp(input),
  });
}

/**
 * Customer sign-in. The query cache is cleared *before* the session is stored: storing the
 * session mounts the next route group, whose queries start at once; clearing afterwards used to
 * wipe those in-flight queries and leave empty screens until the next refetch.
 */
export function useVerifyOtp() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: OtpVerifyInput): Promise<AuthSession> => {
      const session = await api.auth.verifyOtp(input);
      let fullName = session.user.fullName;
      queryClient.clear();
      setSession({
        role: session.user.role,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userId: session.user.id,
        // New accounts have no name yet; the (setup) group collects it (D21).
        profileComplete: fullName !== null,
      });
      // The in-memory mock forgets runtime accounts on reload: reuse the name this device saved.
      const remembered = useSettingsStore.getState().rememberedNames[input.phone];
      if (fullName === null && remembered) {
        const user = await api.auth.updateProfile({ fullName: remembered });
        fullName = user.fullName;
        if (fullName !== null) useSessionStore.getState().markProfileComplete();
      }
      return { ...session, user: { ...session.user, fullName } };
    },
    onSuccess: () => {
      // Every sign-in replays the home tour (owner, 2026-10-13); the profile can replay it too.
      useSettingsStore.getState().setTourDone(false);
    },
  });
}

/** Driver sign-in (D22, amended 2026-10-15): phone or e-mail + the password set by the admin. */
export function useDriverLogin() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: DriverLoginInput): Promise<AuthSession> => {
      const session = await api.auth.driverLogin(input);
      queryClient.clear();
      setSession({
        role: session.user.role,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userId: session.user.id,
        profileComplete: true,
      });
      return session;
    },
  });
}

export function useLogout() {
  const api = useApi();
  const queryClient = useQueryClient();
  const clear = useSessionStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useSessionStore.getState().refreshToken;
      if (refreshToken) await api.auth.logout(refreshToken).catch(() => undefined);
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useMe() {
  const api = useApi();
  const enabled = useSessionStore(selectIsAuthenticated);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.auth.me(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.auth.updateProfile(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      if (user.fullName !== null) {
        useSessionStore.getState().markProfileComplete();
        useSettingsStore.getState().rememberName(user.phone, user.fullName);
      }
    },
  });
}
