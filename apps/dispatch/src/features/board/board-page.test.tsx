import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/store/session.store';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { BoardPage } from './board-page';

describe('BoardPage', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it("places today's trips on their mixer rows and edits a planned trip", async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<BoardPage initialDate="2026-10-09" />, client);
    expect(await screen.findByText('90-TR-631 · 12 m³')).toBeInTheDocument();
    expect(screen.getByText('Reys 1 · CN-2026-000104')).toBeInTheDocument();
    expect(screen.getByText('Reys 3 · CN-2026-000104')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Reys 3 · CN-2026-000104'));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Reys 3 · CN-2026-000104')).toBeInTheDocument();
    await userEvent.selectOptions(within(sheet).getByLabelText('Sürücü'), 'drv_3');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Yadda saxla' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await client.dispatch.getOrder('ord_104')).deliveries[2]?.driver?.fullName).toBe(
      'Kamran Hüseynov',
    );
  });

  it('offers to plan confirmed orders of the day', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<BoardPage initialDate="2026-10-11" />, client);
    expect(await screen.findByText('Planlanmamış təsdiqli sifarişlər')).toBeInTheDocument();
    expect(screen.getByText('CN-2026-000102')).toBeInTheDocument();
    expect(screen.getByText('Bu gün üçün reys yoxdur')).toBeInTheDocument();
  });
});
