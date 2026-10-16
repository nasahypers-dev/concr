import { fireEvent, screen } from '@testing-library/react';
import { useSessionStore } from '@/store/session.store';
import { makeClient, renderWithProviders, signInAs } from '@/test/test-utils';
import { ReportsPage } from './reports-page';

describe('ReportsPage', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
    jest.useFakeTimers({ now: new Date('2026-10-09T08:30:00.000Z'), advanceTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('summarises the last 30 days', async () => {
    const client = makeClient();
    await signInAs(client, 'admin');
    renderWithProviders(<ReportsPage />, client);
    expect(await screen.findAllByText('Markalar üzrə')).toHaveLength(2);
    // 104 (today), 105 (3 days ago) and 106 (6 days ago) fall in the range: 22 m³ delivered, 1 completed.
    expect(screen.getByText('22 m³')).toBeInTheDocument();
    expect(screen.getByText('M200')).toBeInTheDocument();
  });

  it('never lets the start pass the end or the end fall before the start', async () => {
    const client = makeClient();
    await signInAs(client, 'admin');
    renderWithProviders(<ReportsPage />, client);
    await screen.findAllByText('Markalar üzrə');
    const from = screen.getByLabelText('Başlanğıc');
    const to = screen.getByLabelText('Son');
    expect(from).toHaveValue('2026-09-09');
    expect(to).toHaveValue('2026-10-09');

    // End 17 Oct, then a typed start of 19 Oct: while typing, "Göstər" is disabled and the message
    // shows; leaving the field snaps the start to the end, the end never moves.
    fireEvent.change(to, { target: { value: '2026-10-17' } });
    fireEvent.blur(to);
    fireEvent.change(from, { target: { value: '2026-10-19' } });
    expect(screen.getByRole('button', { name: 'Göstər' })).toBeDisabled();
    expect(screen.getByText('Başlanğıc tarixi son tarixdən sonra ola bilməz')).toBeInTheDocument();
    expect(from).toHaveAttribute('max', '2026-10-17');
    fireEvent.blur(from);
    expect(from).toHaveValue('2026-10-17');
    expect(to).toHaveValue('2026-10-17');
    expect(screen.getByRole('button', { name: 'Göstər' })).toBeEnabled();

    // Start 10 Oct, then an end of 5 Oct: the end snaps to the start, the start stays.
    fireEvent.change(from, { target: { value: '2026-10-10' } });
    fireEvent.blur(from);
    fireEvent.change(to, { target: { value: '2026-10-05' } });
    expect(to).toHaveAttribute('min', '2026-10-10');
    fireEvent.blur(to);
    expect(from).toHaveValue('2026-10-10');
    expect(to).toHaveValue('2026-10-10');
    expect(screen.getByRole('button', { name: 'Göstər' })).toBeEnabled();
  });
});
