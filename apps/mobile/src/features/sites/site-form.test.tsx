import { createFixtures, createMockApiClient } from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import type { PropsWithChildren } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { initI18n } from '@/i18n';
import { useSessionStore } from '@/store/session.store';
import { SiteForm } from './site-form';

beforeAll(() => {
  initI18n('az');
});

function makeWrapper() {
  const client = createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    fixtures: createFixtures(new Date('2026-10-09T08:30:00.000Z')),
    latencyMs: 0,
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <ApiProvider client={client}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    );
  };
}

const placemark = {
  street: 'Əhməd Rəcəbli',
  streetNumber: '12',
  name: null,
  district: 'Yasamal',
  subregion: null,
  city: 'Bakı',
  region: null,
  country: null,
  postalCode: null,
  isoCountryCode: null,
  timezone: null,
  formattedAddress: null,
};

describe('SiteForm', () => {
  it('fills the address after the picker confirms the current location', async () => {
    jest.mocked(Location.reverseGeocodeAsync).mockResolvedValueOnce([placemark]);
    await render(<SiteForm submitting={false} onSubmit={jest.fn()} />, {
      wrapper: makeWrapper(),
    });
    const [, openPicker] = screen.getAllByRole('button', { name: 'Xəritədə seç' });
    await fireEvent.press(openPicker!);
    await fireEvent.press(screen.getByRole('button', { name: 'Cari yerimi istifadə et' }));
    const confirm = screen.getByRole('button', { name: 'Bu yeri təsdiqlə' });
    await waitFor(() => expect(confirm).not.toBeDisabled());
    await fireEvent.press(confirm);
    await waitFor(() =>
      expect(screen.getByLabelText('Ünvan').props.value).toBe('Əhməd Rəcəbli 12, Yasamal, Bakı'),
    );
    expect(screen.getByText('Ünvan avtomatik tapıldı, yoxlayın')).toBeTruthy();
  });

  it('never overwrites an address the customer typed', async () => {
    jest.mocked(Location.reverseGeocodeAsync).mockResolvedValueOnce([placemark]);
    await render(<SiteForm submitting={false} onSubmit={jest.fn()} />, {
      wrapper: makeWrapper(),
    });
    await fireEvent.changeText(screen.getByLabelText('Ünvan'), 'Öz ünvanım 5');
    const [, openPicker] = screen.getAllByRole('button', { name: 'Xəritədə seç' });
    await fireEvent.press(openPicker!);
    await fireEvent.press(screen.getByRole('button', { name: 'Cari yerimi istifadə et' }));
    const confirm = screen.getByRole('button', { name: 'Bu yeri təsdiqlə' });
    await waitFor(() => expect(confirm).not.toBeDisabled());
    await fireEvent.press(confirm);
    await waitFor(() => expect(Location.reverseGeocodeAsync).toHaveBeenCalled());
    expect(screen.getByLabelText('Ünvan').props.value).toBe('Öz ünvanım 5');
  });
});
