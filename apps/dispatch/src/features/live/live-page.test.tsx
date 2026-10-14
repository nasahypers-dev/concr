import { screen } from '@testing-library/react';
import { useSessionStore } from '@/store/session.store';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { LivePage } from './live-page';

// MapLibre needs WebGL; the page's data and alerts are what the test checks.
jest.mock('@/components/map/live-map', () => ({
  LiveMap: ({ markers }: { markers: { id: string }[] }) => (
    <div data-testid="live-map" data-markers={markers.map((m) => m.id).join(',')} />
  ),
}));

describe('LivePage', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('lists the mixers with their trips and shows the alerts', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    const trip = client.store.findDelivery('del_104_2')!;
    trip.etaMinutes = 120;
    trip.lastLocationAt = new Date(
      Date.parse('2026-10-09T08:30:00.000Z') - 5 * 60_000,
    ).toISOString();

    renderWithProviders(<LivePage />, client);
    expect(await screen.findAllByTestId('live-truck')).toHaveLength(6);
    expect(screen.getByText('90-AA-003 · Elşən Məmmədov')).toBeInTheDocument();
    expect(screen.getByText('Gecikir')).toBeInTheDocument();
    expect(screen.getByText('Siqnal yoxdur')).toBeInTheDocument();
    const map = await screen.findByTestId('live-map');
    expect(map.dataset.markers).toContain('truck:truck_10_1');
    expect(map.dataset.markers).toContain('site:del_104_2');
  });
});
