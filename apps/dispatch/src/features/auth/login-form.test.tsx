import { messages } from '@concr/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { LoginForm } from './login-form';

function renderForm(enabled = true) {
  return render(
    <NextIntlClientProvider locale="az" messages={messages.az}>
      <LoginForm enabled={enabled} />
    </NextIntlClientProvider>,
  );
}

/** jsdom has no global Response; this is the subset apiFetch() reads. */
function fakeResponse(status: number, body: unknown, requestId = 'req-1'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Not Found',
    headers: { get: (name: string) => (name === 'x-request-id' ? requestId : null) },
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('LoginForm', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders Azerbaijani labels', () => {
    renderForm();
    expect(screen.getByText('Dispetçer paneli')).toBeInTheDocument();
    expect(screen.getByLabelText('E-poçt')).toBeInTheDocument();
    expect(screen.getByLabelText('Şifrə')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daxil ol' })).toBeInTheDocument();
  });

  it('is fully disabled with a notice while staff sign-in is switched off (Phase 0)', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    renderForm(false);
    expect(screen.getByRole('status')).toHaveTextContent('Giriş hələ aktiv deyil');
    expect(screen.getByLabelText('E-poçt')).toBeDisabled();
    expect(screen.getByLabelText('Şifrə')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Daxil ol' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows validation messages on empty submit and does not call the API', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Daxil ol' }));
    expect(await screen.findByText('Düzgün e-poçt ünvanı daxil edin')).toBeInTheDocument();
    expect(screen.getByText('Şifrə ən azı 8 simvoldan ibarət olmalıdır')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the API error code translation when the API rejects', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      fakeResponse(404, {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Cannot POST /api/v1/auth/staff/login',
        requestId: 'req-1',
      }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText('E-poçt'), 'dispatcher@novxanibeton.az');
    await userEvent.type(screen.getByLabelText('Şifrə'), 'Dispatcher123!');
    await userEvent.click(screen.getByRole('button', { name: 'Daxil ol' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Tapılmadı'));
  });

  it('shows the offline message when the request cannot be sent', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    renderForm();
    await userEvent.type(screen.getByLabelText('E-poçt'), 'dispatcher@novxanibeton.az');
    await userEvent.type(screen.getByLabelText('Şifrə'), 'Dispatcher123!');
    await userEvent.click(screen.getByRole('button', { name: 'Daxil ol' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('İnternet bağlantısı yoxdur'),
    );
  });
});
