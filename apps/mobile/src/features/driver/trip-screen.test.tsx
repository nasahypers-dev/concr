import { createFixtures, createMockApiClient, DEV_DRIVER_PASSWORD } from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { initI18n } from '@/i18n';
import { useSessionStore } from '@/store/session.store';
import { TripScreen } from './trip-screen';

const NOW = new Date('2026-10-09T08:30:00.000Z');
const RAUF = '+994500000012';

// The happy path presses five buttons through the mock; CI runners need more than the 5 s default.
jest.setTimeout(20_000);

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

describe('TripScreen', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('walks the trip through the big buttons to the handover act', async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    const onDone = jest.fn();
    await render(<TripScreen id="del_104_3" onBack={jest.fn()} onDone={onDone} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });

    expect(await screen.findByText('Reys 3/3')).toBeTruthy();
    expect(screen.getByText('Yasamal, ev tikintisi')).toBeTruthy();
    expect(screen.getByText('Bu reys: 5 m³')).toBeTruthy();

    await fireEvent.press(screen.getByText('Yükləməyə başla'));
    expect(await screen.findByText('Yüklənir')).toBeTruthy();

    await fireEvent.press(screen.getByText('Yola düşdüm'));
    expect(await screen.findByText('Yoldadır')).toBeTruthy();
    expect(await screen.findByText('GPS mövqe ötürülür')).toBeTruthy();
    expect(screen.getByLabelText('concrete-timer')).toBeTruthy();
    expect(screen.getByText('Yola çıxdı')).toBeTruthy();

    await fireEvent.press(screen.getByText('Obyektə çatdım'));
    expect(await screen.findByText('Obyektdədir')).toBeTruthy();
    expect(screen.getByText('Problem var')).toBeTruthy();

    await fireEvent.press(screen.getByText('Boşaltmaya başladım'));
    expect(await screen.findByText('Boşaldılır')).toBeTruthy();

    await fireEvent.press(screen.getByText('Reysi tamamla'));
    await fireEvent.press(await screen.findByText('Tamamla və akt yarat'));
    expect(await screen.findByText('Bu sahə mütləqdir')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Betonu qəbul edən şəxs'), 'Usta Vüqar');
    await fireEvent.press(screen.getByText('Şəkil çək'));
    await waitFor(() => expect(screen.getByText('Foto (1/3)')).toBeTruthy());
    await fireEvent.press(screen.getByText('Tamamla və akt yarat'));

    expect(await screen.findByText('Təhvil aktı TA-2026-000104-3')).toBeTruthy();
    expect(screen.getByText('Qəbul etdi: Usta Vüqar')).toBeTruthy();
    expect(screen.getByText('Reys tamamlandı')).toBeTruthy();
    const trip = await client.driver.getDelivery('del_104_3');
    expect(trip.status).toBe('COMPLETED');
    expect(trip.document?.photoUrls).toEqual(['file:///tmp/photo.jpg']);
    await fireEvent.press(screen.getByText('Bugünkü reyslərə qayıt'));
    expect(onDone).toHaveBeenCalled();
  });

  it('marks an arrived trip as failed with a reason', async () => {
    const client = makeClient();
    await signIn(client, RAUF);
    await client.driver.setStatus('del_104_3', { to: 'LOADING' });
    await client.driver.setStatus('del_104_3', { to: 'EN_ROUTE' });
    await client.driver.setStatus('del_104_3', { to: 'ARRIVED' });
    await render(<TripScreen id="del_104_3" onBack={jest.fn()} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });
    await fireEvent.press(await screen.findByText('Problem var'));
    await fireEvent.press(await screen.findByText('Uğursuz kimi qeyd et'));
    expect(await screen.findByText('Bu sahə mütləqdir')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Səbəb'), 'Obyektə giriş bağlıdır');
    await fireEvent.press(screen.getByText('Uğursuz kimi qeyd et'));
    expect(await screen.findByText('Uğursuz')).toBeTruthy();
    expect(screen.getByText(/Obyektə giriş bağlıdır/)).toBeTruthy();
    expect((await client.driver.getDelivery('del_104_3')).failReason).toBe(
      'Obyektə giriş bağlıdır',
    );
  });

  it('explains a trip that is not assigned yet', async () => {
    const client = makeClient();
    await signIn(client, '+994500000011');
    await render(<TripScreen id="del_103_1" onBack={jest.fn()} now={() => NOW} />, {
      wrapper: wrapperFor(client),
    });
    expect(await screen.findByText('Reys 1/2')).toBeTruthy();
    expect(screen.getByText('Yükləməyə başla')).toBeTruthy();
  });
});
