import { createFixtures, createMockApiClient } from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { DEV_OTP_CODE } from './use-auth';
import { initI18n } from '@/i18n';
import { useSessionStore } from '@/store/session.store';
import { SetupNameScreen } from './setup-name-screen';

beforeAll(() => {
  initI18n('az');
});

function makeClient() {
  return createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    fixtures: createFixtures(new Date('2026-10-09T08:30:00.000Z')),
    latencyMs: 0,
  });
}

function wrapperFor(client: ReturnType<typeof makeClient>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <ApiProvider client={client}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    );
  };
}

describe('SetupNameScreen', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('requires both the first and the last name', async () => {
    await render(<SetupNameScreen />, { wrapper: wrapperFor(makeClient()) });
    await fireEvent.press(screen.getByRole('button', { name: 'Davam et' }));
    expect(screen.getAllByText('Bu sahə mütləqdir')).toHaveLength(2);
  });

  it('saves the name and completes the session', async () => {
    const client = makeClient();
    const phone = '+994500000099';
    await client.auth.requestOtp({ phone });
    const session = await client.auth.verifyOtp({ phone, code: DEV_OTP_CODE });
    useSessionStore.getState().setSession({
      role: session.user.role,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.user.id,
      profileComplete: false,
    });
    await render(<SetupNameScreen />, { wrapper: wrapperFor(client) });
    await fireEvent.changeText(screen.getByLabelText('Ad'), 'Nurlan');
    await fireEvent.changeText(screen.getByLabelText('Soyad'), 'Əsədli');
    await fireEvent.press(screen.getByRole('button', { name: 'Davam et' }));
    await waitFor(() => expect(useSessionStore.getState().profileComplete).toBe(true));
    expect((await client.auth.me()).fullName).toBe('Nurlan Əsədli');
  });
});
