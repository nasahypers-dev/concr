import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/store/session.store';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { OrderDetailPage } from './order-detail-page';

describe('OrderDetailPage', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('shows the order facts and confirms it with a price override', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<OrderDetailPage id="ord_101" />, client);
    expect(
      await screen.findByRole('heading', { name: 'Sifariş CN-2026-000101' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Yasamal, ev tikintisi')).toBeInTheDocument();
    expect(screen.getByText('M300 · 12 m³ · P3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Təsdiqlə' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByText('Yekun qiyməti dəyiş'));
    const total = within(dialog).getByLabelText('Yeni yekun məbləğ (₼)');
    await userEvent.clear(total);
    await userEvent.type(total, '1500');
    await userEvent.type(within(dialog).getAllByLabelText('Səbəb')[0]!, 'Daimi müştəri');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Təsdiqlə' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await client.dispatch.getOrder('ord_101')).status).toBe('CONFIRMED');
    expect(await screen.findByText('Təsdiqləndi')).toBeInTheDocument();
    expect(screen.getAllByText(/Daimi müştəri/).length).toBeGreaterThan(0);
    // CONFIRMED orders offer scheduling instead of confirmation
    expect(screen.getByRole('button', { name: 'Planlaşdır' })).toBeInTheDocument();
  });

  it('requires a reason to reject and then shows it', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<OrderDetailPage id="ord_101" />, client);
    await userEvent.click(await screen.findByRole('button', { name: 'Rədd et' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rədd et' }));
    expect(within(dialog).getByText('Ən azı 3 simvol yazın')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('Səbəb'), 'Həcm kifayət deyil');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rədd et' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Rədd edildi')).toBeInTheDocument();
    expect(screen.getAllByText('Səbəb: Həcm kifayət deyil').length).toBeGreaterThan(0);
  });

  it('schedules a confirmed order from the proposal', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<OrderDetailPage id="ord_102" />, client);
    await userEvent.click(await screen.findByRole('button', { name: 'Planlaşdır' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findAllByTestId('trip-row')).toHaveLength(1);
    expect(within(dialog).getByLabelText('Həcm (m³) 1')).toHaveValue('8');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Planlaşdır' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await client.dispatch.getOrder('ord_102')).status).toBe('SCHEDULED');
    expect(await screen.findByText('Reys 1')).toBeInTheDocument();
  });
});
