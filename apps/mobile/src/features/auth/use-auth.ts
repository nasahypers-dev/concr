import type {
  AuthSession,
  OtpRequestInput,
  OtpVerifyInput,
  UpdateProfileInput,
} from '@concr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';
import { selectIsAuthenticated, useSessionStore } from '@/store/session.store';
import { useSettingsStore } from '@/store/settings.store';

/** Dev/mock OTP (spec §18). The mock API also returns it as `devCode`. */
export const DEV_OTP_CODE = '123456';
/** Seeded customer used by the dev quick login on the welcome screen. */
export const DEV_CUSTOMER_PHONE = '+994500000001';
/** Seeded driver (Rauf, mixer 90-AA-005) used by the dev driver login on the welcome screen. */
export const DEV_DRIVER_PHONE = '+994500000012';

export function useRequestOtp() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: OtpRequestInput) => api.auth.requestOtp(input),
  });
}

export function useVerifyOtp() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: OtpVerifyInput): Promise<AuthSession> => {
      const session = await api.auth.verifyOtp(input);
      let fullName = session.user.fullName;
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
      queryClient.clear();
      // Every sign-in replays the home tour (owner, 2026-10-13); the profile can replay it too.
      useSettingsStore.getState().setTourDone(false);
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
