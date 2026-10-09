import { isApiClientError } from '@concr/shared';
import { QueryClient } from '@tanstack/react-query';

/** One client for the app; server state lives here (CLAUDE.md conventions). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
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
