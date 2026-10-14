import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/store/session.store';
import { mockRouter, resetRouterMock } from '@/test/router-mock';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { OrdersTablePage } from './orders-table-page';

describe('OrdersTablePage', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
    resetRouterMock();
  });

  it('lists every order, filters by status and searches', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<OrdersTablePage />, client);
    expect(await screen.findByText('1–6 / 6')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tamamlandı', pressed: false }));
    expect(await screen.findByText('1–1 / 1')).toBeInTheDocument();
    expect(screen.getByText('CN-2026-000105')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Filtrləri təmizlə' }));
    await userEvent.type(screen.getByLabelText('Nömrə, müştəri və ya obyekt'), 'Xırdalan');
    await waitFor(() => expect(screen.getByText('1–2 / 2')).toBeInTheDocument());

    await userEvent.click(screen.getByText('CN-2026-000102'));
    expect(mockRouter.push).toHaveBeenCalledWith('/orders/ord_102');
  });
});
