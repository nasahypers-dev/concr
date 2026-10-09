import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { initI18n } from '@/i18n';
import { LocationPicker } from './location-picker';

beforeAll(() => {
  initI18n('az');
});

const plant = { lat: 40.4858529, lng: 49.8294278 };

describe('LocationPicker', () => {
  it('does not confirm until a point was chosen', async () => {
    const onConfirm = jest.fn();
    await render(
      <LocationPicker
        visible
        initial={null}
        plant={plant}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByTestId('map-center-pin')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bu yeri təsdiqlə' })).toBeDisabled();
  });

  it('confirms the previously chosen point when editing', async () => {
    const onConfirm = jest.fn();
    const initial = { lat: 40.39, lng: 49.81 };
    await render(
      <LocationPicker
        visible
        initial={initial}
        plant={plant}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Bu yeri təsdiqlə' }));
    expect(onConfirm).toHaveBeenCalledWith(initial);
  });

  it('shows a message when the location permission is denied', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValueOnce({
      status: 'denied',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
    await render(
      <LocationPicker
        visible
        initial={null}
        plant={plant}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cari yerimi istifadə et' }));
    expect(await screen.findByText(/Məkan icazəsi verilmədi/)).toBeTruthy();
  });
});
