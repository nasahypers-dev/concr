import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useCurrentLocation } from './use-current-location';

const mockedRequest = jest.mocked(Location.requestForegroundPermissionsAsync);
const mockedPosition = jest.mocked(Location.getCurrentPositionAsync);

describe('useCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the GPS fix when permission is granted', async () => {
    const { result } = await renderHook(() => useCurrentLocation());
    let point: { lat: number; lng: number } | null = null;
    await act(async () => {
      point = await result.current.locate();
    });
    expect(point).toEqual({ lat: 40.4, lng: 49.8 });
    expect(result.current.status).toBe('granted');
    expect(mockedPosition).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced });
  });

  it('reports a denied permission without asking for a position', async () => {
    mockedRequest.mockResolvedValueOnce({
      status: 'denied',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
    const { result } = await renderHook(() => useCurrentLocation());
    let point: { lat: number; lng: number } | null = { lat: 0, lng: 0 };
    await act(async () => {
      point = await result.current.locate();
    });
    expect(point).toBeNull();
    expect(result.current.status).toBe('denied');
    expect(mockedPosition).not.toHaveBeenCalled();
  });

  it('reports a failure when the position cannot be read', async () => {
    mockedPosition.mockRejectedValueOnce(new Error('timeout'));
    const { result } = await renderHook(() => useCurrentLocation());
    await act(async () => {
      await result.current.locate();
    });
    expect(result.current.status).toBe('error');
  });
});
