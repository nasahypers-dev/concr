import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/store/session.store';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { DriversTab } from './fleet-tabs';

describe('DriversTab (D22)', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('adds a driver with a mixer and deactivates one', async () => {
    const client = makeClient();
    await signInAs(client, 'admin');
    renderWithProviders(<DriversTab readOnly={false} />, client);
    expect(await screen.findAllByTestId('driver-row')).toHaveLength(3);

    await userEvent.click(screen.getByRole('button', { name: 'Sürücü əlavə et' }));
    const sheet = await screen.findByRole('dialog');
    await userEvent.type(within(sheet).getByLabelText('Ad, soyad'), 'Nicat Quliyev');
    await userEvent.type(within(sheet).getByLabelText('Telefon'), '500000014');
    await userEvent.selectOptions(within(sheet).getByLabelText('Mikser'), 'truck_8_1');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Yadda saxla' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Nicat Quliyev')).toBeInTheDocument();
    expect(screen.getAllByTestId('driver-row')).toHaveLength(4);

    const kamran = screen.getAllByTestId('driver-row')[2]!;
    await userEvent.click(within(kamran).getByRole('button', { name: 'Deaktiv et' }));
    const confirm = await screen.findByRole('dialog');
    await userEvent.click(within(confirm).getByRole('button', { name: 'Deaktiv et' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(within(kamran).getByText('Deaktiv')).toBeInTheDocument());
    expect((await client.admin.listDrivers()).find((d) => d.id === 'drv_3')?.isActive).toBe(false);
  });

  it('keeps everything read-only for a dispatcher', async () => {
    const client = makeClient();
    await signInAs(client, 'dispatcher');
    renderWithProviders(<DriversTab readOnly />, client);
    expect(await screen.findAllByTestId('driver-row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Sürücü əlavə et' })).toBeDisabled();
  });
});
