import { ErrorCode, isApiClientError } from '@concr/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/store/session.store';

function isUnauthorized(error: unknown): boolean {
  return isApiClientError(error) && error.code === ErrorCode.UNAUTHORIZED;
}

/**
 * A rejected access token means the stored session is dead: sign the user out so the app
 * returns to the login screen instead of showing error states everywhere. In mock mode this
 * happens after every reload for users created at runtime (the in-memory store is rebuilt);
 * with the real API the refresh-token flow (Phase B2) runs before this fallback.
 */
function signOutOnUnauthorized(error: unknown): void {
  if (isUnauthorized(error)) useSessionStore.getState().clear();
}

/** One client for the app; server state lives here (CLAUDE.md conventions). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: signOutOnUnauthorized }),
    mutationCache: new MutationCache({ onError: signOutOnUnauthorized }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          // Never retry 4xx (auth, validation, not found); retry network/5xx once.
          if (isApiClientError(error) && error.statusCode < 500) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: 0 },
    },
  });
}
