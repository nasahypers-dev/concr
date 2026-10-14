import { screen } from '@testing-library/react';
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
});
