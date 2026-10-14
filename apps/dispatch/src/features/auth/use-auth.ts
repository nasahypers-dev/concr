import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApi } from '@/api/api-provider';
import { useSessionStore } from '@/store/session.store';

/** Revokes the refresh token (best effort), clears the session and the cache, returns to login. */
export function useLogout() {
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const clear = useSessionStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useSessionStore.getState().refreshToken;
      if (refreshToken) await api.auth.logout(refreshToken).catch(() => undefined);
    },
    onSettled: () => {
      clear();
      queryClient.clear();
      router.replace('/login');
    },
  });
}
