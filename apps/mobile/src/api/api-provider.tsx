import { type ApiClient, createMockApiClient } from '@concr/shared';
import { createContext, type PropsWithChildren, useContext } from 'react';
import { useSessionStore } from '@/store/session.store';

export type ApiMode = 'mock' | 'http';

/** `EXPO_PUBLIC_API_MODE`: `mock` (default until Phase B2) or `http`. */
export function resolveApiMode(
  raw: string | undefined = process.env.EXPO_PUBLIC_API_MODE,
): ApiMode {
  return raw === 'http' ? 'http' : 'mock';
}

const SIMULATED_LATENCY_MS = 200;

let singleton: ApiClient | null = null;

/**
 * One client per app process: the mock keeps its state in memory, so it must not be recreated
 * on re-render. The HTTP implementation lands with the backend (ADR 0006).
 */
export function getApiClient(mode: ApiMode = resolveApiMode()): ApiClient {
  if (singleton) return singleton;
  if (mode === 'http') {
    throw new Error('HttpApiClient is not available yet; set EXPO_PUBLIC_API_MODE=mock');
  }
  singleton = createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    latencyMs: SIMULATED_LATENCY_MS,
  });
  return singleton;
}

/** Tests create their own client per case. */
export function resetApiClientForTests(): void {
  singleton = null;
}

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ client, children }: PropsWithChildren<{ client?: ApiClient }>) {
  const value = client ?? getApiClient();
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi must be used inside <ApiProvider>');
  return api;
}
