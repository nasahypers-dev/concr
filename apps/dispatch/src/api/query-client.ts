import { ErrorCode, isApiClientError } from '@concr/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/store/session.store';

function isSessionDead(error: unknown): boolean {
  return (
    isApiClientError(error) &&
    (error.code === ErrorCode.UNAUTHORIZED || error.code === ErrorCode.USER_INACTIVE)
  );
}

/**
 * A rejected token means the stored session is dead: sign out so the panel returns to the login
 * page instead of showing error states everywhere. In mock mode this happens after a reload only
 * for staff created at runtime; the seeded accounts survive because the token encodes the user id.
 */
function signOutOnDeadSession(error: unknown): void {
  if (isSessionDead(error)) useSessionStore.getState().clear();
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: signOutOnDeadSession }),
    mutationCache: new MutationCache({ onError: signOutOnDeadSession }),
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (failureCount, error) => {
          if (isApiClientError(error) && error.statusCode < 500) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: 0 },
    },
  });
}
