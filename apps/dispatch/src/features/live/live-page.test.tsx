import { fireEvent, screen, within } from '@testing-library/react';
import { useSessionStore } from '@/store/session.store';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { LivePage } from './live-page';

// MapLibre needs WebGL; the page's data, alerts and marker clicks are what the test checks.
jest.mock('@/components/map/live-map', () => ({
  LiveMap: ({
    markers,
  }: {
    markers: { id: string; selected?: boolean; onClick?: () => void }[];
  }) => (
    <div data-testid="live-map" data-markers={markers.map((m) => m.id).join(',')}>
      {markers.map((m) => (
        <button
          key={m.id}
          type="button"
          data-testid={`marker-${m.id}`}
          data-selected={m.selected ? 'true' : 'false'}
          onClick={m.onClick}
        />
      ))}
    </div>
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
    expect(screen.getByText('10-VE-908 · Elşən Məmmədov')).toBeInTheDocument();
    expect(screen.getByText('Gecikir')).toBeInTheDocument();
    // one in the legend, one as the alert
    expect(screen.getAllByText('Siqnal yoxdur')).toHaveLength(2);
    const map = await screen.findByTestId('live-map');
    expect(map.dataset.markers).toContain('truck:truck_10_1');
    expect(map.dataset.markers).toContain('site:del_104_2');
  });

  it('opens an info panel with the company name when a mixer marker is clicked', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<LivePage />, client);
    const marker = await screen.findByTestId('marker-truck:truck_10_1');
    expect(screen.queryByTestId('truck-info')).not.toBeInTheDocument();

    fireEvent.click(marker);
    const panel = await screen.findByTestId('truck-info');
    expect(within(panel).getByText('10-VE-908')).toBeInTheDocument();
    expect(within(panel).getByText('Novxanı Beton')).toBeInTheDocument();
    expect(within(panel).getByText('Elşən Məmmədov')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'CN-2026-000104' })).toHaveAttribute(
      'href',
      '/orders/ord_104',
    );
    expect(screen.getByTestId('marker-truck:truck_10_1').dataset.selected).toBe('true');

    fireEvent.click(within(panel).getByRole('button', { name: 'Bağla' }));
    expect(screen.queryByTestId('truck-info')).not.toBeInTheDocument();
    expect(screen.getByTestId('marker-truck:truck_10_1').dataset.selected).toBe('false');
  });
});
