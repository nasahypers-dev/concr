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

/** Dev/mock OTP (spec §18). The mock API also returns it as `devCode`. */
export const DEV_OTP_CODE = '123456';
/** Seeded customer used by the dev quick login on the welcome screen. */
export const DEV_CUSTOMER_PHONE = '+994500000001';

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
    mutationFn: (input: OtpVerifyInput) => api.auth.verifyOtp(input),
    onSuccess: (session: AuthSession) => {
      queryClient.clear();
      setSession({
        role: session.user.role,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userId: session.user.id,
      });
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
    },
  });
}
