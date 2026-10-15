import {
  createFixtures,
  createMockApiClient,
  DEV_DRIVER_PASSWORD,
  DeliveryStatus,
} from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { useSessionStore } from '@/store/session.store';
import {
  tripDays,
  useDriverDeliveries,
  useDriverDelivery,
  useDriverMe,
  useSetDeliveryStatus,
  useSetShift,
} from './use-driver';

const NOW = new Date('2026-10-09T08:30:00.000Z');
const RAUF = '+994500000012';

function makeClient() {
  return createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    fixtures: createFixtures(NOW),
    now: () => NOW,
    latencyMs: 0,
  });
}

async function signIn(client: ReturnType<typeof makeClient>, phone: string) {
  const session = await client.auth.driverLogin({ login: phone, password: DEV_DRIVER_PASSWORD });
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

describe('driver hooks on the mock client', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('loads the driver with the assigned mixer and the day lists', async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    const { result } = await renderHook(
      () => ({
        me: useDriverMe(),
        today: useDriverDeliveries('2026-10-09'),
        tomorrow: useDriverDeliveries('2026-10-10'),
      }),
      { wrapper: wrapperFor(client) },
    );
    await waitFor(() => expect(result.current.today.isSuccess).toBe(true));
    expect(result.current.today.data?.map((trip) => trip.id)).toEqual(['del_104_1', 'del_104_3']);
    await waitFor(() => expect(result.current.me.data?.truck?.plateNumber).toBe('90-TR-631'));
    await waitFor(() => expect(result.current.tomorrow.data).toEqual([]));
  });

  it('toggling the shift updates the cached driver without a refetch', async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    const { result } = await renderHook(() => ({ me: useDriverMe(), shift: useSetShift() }), {
      wrapper: wrapperFor(client),
    });
    await waitFor(() => expect(result.current.me.data?.isOnShift).toBe(true));
    await act(async () => {
      await result.current.shift.mutateAsync({ onShift: false });
    });
    await waitFor(() => expect(result.current.me.data?.isOnShift).toBe(false));
    expect((await client.driver.me()).isOnShift).toBe(false);
  });

  it('a status change updates the trip detail and refreshes the day list', async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    const { result } = await renderHook(
      () => ({
        trip: useDriverDelivery('del_104_3'),
        today: useDriverDeliveries('2026-10-09'),
        setStatus: useSetDeliveryStatus('del_104_3'),
      }),
      { wrapper: wrapperFor(client) },
    );
    await waitFor(() => expect(result.current.trip.data?.status).toBe(DeliveryStatus.ASSIGNED));
    await act(async () => {
      await result.current.setStatus.mutateAsync({ to: DeliveryStatus.LOADING });
    });
    await waitFor(() => expect(result.current.trip.data?.status).toBe(DeliveryStatus.LOADING));
    await waitFor(() =>
      expect(result.current.today.data?.find((trip) => trip.id === 'del_104_3')?.status).toBe(
        DeliveryStatus.LOADING,
      ),
    );
  });

  it('tripDays uses Baku calendar days', () => {
    expect(tripDays(new Date('2026-10-09T21:30:00.000Z'))).toEqual({
      today: '2026-10-10',
      tomorrow: '2026-10-11',
    });
  });
});
