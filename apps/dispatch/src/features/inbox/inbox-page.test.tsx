import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/store/session.store';
import { mockRouter, resetRouterMock } from '@/test/router-mock';
import { makeClient, NOW, renderWithProviders, signInAs } from '@/test/test-utils';
import { InboxPage } from './inbox-page';

describe('InboxPage', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
    resetRouterMock();
  });

  it('lists the pending order with its facts and opens it', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<InboxPage now={() => NOW} />, client);
    expect(await screen.findByText('CN-2026-000101')).toBeInTheDocument();
    expect(screen.getByText(/Orxan Məmmədli/)).toBeInTheDocument();
    expect(screen.getByText(/M300 · 12 m³ · P3/)).toBeInTheDocument();
    expect(screen.getByText(/1 s 0 dəq gözləyir/)).toBeInTheDocument();
    expect(screen.getAllByTestId('inbox-card')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/orders/ord_101');
  });

  it('shows the empty state once nothing is pending', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    await client.dispatch.reject('ord_101', { reason: 'Test üçün rədd' });
    renderWithProviders(<InboxPage now={() => NOW} />, client);
    expect(await screen.findByText('Yeni sifariş yoxdur')).toBeInTheDocument();
  });
});
