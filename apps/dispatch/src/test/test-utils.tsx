import { createFixtures, createMockApiClient, messages, STAFF } from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSessionStore } from '@/store/session.store';

/** 12:30 in Baku on the fixtures' day. */
export const NOW = new Date('2026-10-09T08:30:00.000Z');

export type TestClient = ReturnType<typeof createMockApiClient>;

export function makeClient(now: Date = NOW): TestClient {
  return createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    fixtures: createFixtures(now),
    now: () => now,
    latencyMs: 0,
  });
}

export async function signInAs(client: TestClient, who: 'dispatcher' | 'admin'): Promise<void> {
  const session = await client.auth.staffLogin({
    email: STAFF[who].email,
    password: STAFF[who].password,
  });
  useSessionStore.getState().setSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      role: session.user.role,
    },
  });
  useSessionStore.getState().markHydrated();
}

export function renderWithProviders(ui: ReactElement, client: TestClient): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="az" messages={messages.az}>
        <ApiProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryClientProvider>
        </ApiProvider>
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
