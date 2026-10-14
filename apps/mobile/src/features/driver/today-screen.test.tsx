import { createFixtures, createMockApiClient } from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { DEV_OTP_CODE } from '@/features/auth/use-auth';
import { initI18n } from '@/i18n';
import { useSessionStore } from '@/store/session.store';
import { DriverTodayScreen } from './today-screen';

const NOW = new Date('2026-10-09T08:30:00.000Z');
const RAUF = '+994500000012';
const ELSHAN = '+994500000011';
const KAMRAN = '+994500000013';

beforeAll(() => {
  initI18n('az');
});

function makeClient() {
  return createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    fixtures: createFixtures(NOW),
    now: () => NOW,
    latencyMs: 0,
  });
}

async function signIn(client: ReturnType<typeof makeClient>, phone: string) {
  await client.auth.requestOtp({ phone });
  const session = await client.auth.verifyOtp({ phone, code: DEV_OTP_CODE });
  useSessionStore.getState().setSession({
    role: session.user.role,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    userId: session.user.id,
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

describe('DriverTodayScreen', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it("shows the shift card with the mixer and today's trips, and opens a trip", async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    const onOpenTrip = jest.fn();
    await render(<DriverTodayScreen onOpenTrip={onOpenTrip} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });
    expect(await screen.findByText('Növbədəyəm')).toBeTruthy();
    expect(screen.getByText(/90-AA-005/)).toBeTruthy();
    expect(await screen.findByText('Reys 1/3 · CN-2026-000104')).toBeTruthy();
    expect(screen.getByText('Reys 3/3 · CN-2026-000104')).toBeTruthy();
    expect(screen.getByText('Yola çıxışa 40 dəq')).toBeTruthy();
    expect(screen.queryByText('Sabahkı reyslər')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Reys 3/3 · CN-2026-000104'));
    expect(onOpenTrip).toHaveBeenCalledWith('del_104_3');
  });

  it('switches the shift off through the API', async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    await render(<DriverTodayScreen onOpenTrip={jest.fn()} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });
    expect(await screen.findByText('Növbədəyəm')).toBeTruthy();
    await fireEvent(screen.getByLabelText('Növbədəyəm'), 'valueChange', false);
    expect(await screen.findByText('Növbədə deyiləm')).toBeTruthy();
    await waitFor(async () => expect((await client.driver.me()).isOnShift).toBe(false));
  });

  it("previews tomorrow's trips in a muted section", async () => {
    const client = makeClient();
    await signIn(client, ELSHAN);
    await render(<DriverTodayScreen onOpenTrip={jest.fn()} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });
    expect(await screen.findByText('Reys 2/3 · CN-2026-000104')).toBeTruthy();
    expect(await screen.findByText('Sabahkı reyslər')).toBeTruthy();
    expect(screen.getByText('Reys 1/2 · CN-2026-000103')).toBeTruthy();
  });

  it('shows the empty state for a driver with nothing today', async () => {
    const client = makeClient();
    await signIn(client, KAMRAN);
    await render(<DriverTodayScreen onOpenTrip={jest.fn()} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });
    expect(await screen.findByText('Növbədə deyiləm')).toBeTruthy();
    expect(screen.getByText('Mikser təyin edilməyib')).toBeTruthy();
    expect(await screen.findByText('Bu gün üçün reys yoxdur')).toBeTruthy();
  });
});
