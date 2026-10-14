import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/store/session.store';
import { mockRouter, resetRouterMock } from '@/test/router-mock';
import { makeClient, renderWithProviders } from '@/test/test-utils';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
    useSessionStore.getState().markHydrated();
    resetRouterMock();
  });

  it('renders Azerbaijani labels', () => {
    renderWithProviders(<LoginForm />, makeClient());
    expect(screen.getByText('Dispetçer paneli')).toBeInTheDocument();
    expect(screen.getByLabelText('E-poçt')).toBeInTheDocument();
    expect(screen.getByLabelText('Şifrə')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daxil ol' })).toBeInTheDocument();
  });

  it('shows validation messages on empty submit', async () => {
    renderWithProviders(<LoginForm />, makeClient());
    await userEvent.click(screen.getByRole('button', { name: 'Daxil ol' }));
    expect(await screen.findByText('Düzgün e-poçt ünvanı daxil edin')).toBeInTheDocument();
    expect(screen.getByText('Şifrə ən azı 8 simvoldan ibarət olmalıdır')).toBeInTheDocument();
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it('rejects a wrong password with the login message', async () => {
    renderWithProviders(<LoginForm />, makeClient());
    await userEvent.type(screen.getByLabelText('E-poçt'), 'dispatcher@novxanibeton.az');
    await userEvent.type(screen.getByLabelText('Şifrə'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Daxil ol' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Daxil olmaq mümkün olmadı'),
    );
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it('stores the staff session and goes to the inbox', async () => {
    renderWithProviders(<LoginForm />, makeClient());
    await userEvent.type(screen.getByLabelText('E-poçt'), 'dispatcher@novxanibeton.az');
    await userEvent.type(screen.getByLabelText('Şifrə'), 'Dispatcher123!');
    await userEvent.click(screen.getByRole('button', { name: 'Daxil ol' }));
    await waitFor(() => expect(useSessionStore.getState().accessToken).toMatch(/^mock\./));
    expect(useSessionStore.getState().user?.role).toBe('DISPATCHER');
    expect(mockRouter.replace).toHaveBeenCalledWith('/inbox');
  });
});
