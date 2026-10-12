import { act, renderHook } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { useSettingsStore } from '@/store/settings.store';
import { useHomeTour } from './use-home-tour';

jest.mock('nativewind', () => ({ colorScheme: { set: jest.fn() } }));

beforeAll(() => {
  initI18n('az');
});

describe('useHomeTour', () => {
  beforeEach(() => {
    useSettingsStore.getState().setTourDone(false);
  });

  it('walks through three steps and persists completion', async () => {
    const { result } = await renderHook(() => useHomeTour(true));
    expect(result.current.visible).toBe(true);
    expect(result.current.step).toBe(0);
    await act(() => result.current.next());
    await act(() => result.current.next());
    expect(result.current.last).toBe(true);
    await act(() => result.current.next());
    expect(useSettingsStore.getState().tourDone).toBe(true);
    expect(result.current.visible).toBe(false);
  });

  it('stays hidden until the screen is ready and after a skip', async () => {
    const { result, rerender } = await renderHook(
      ({ ready }: { ready: boolean }) => useHomeTour(ready),
      {
        initialProps: { ready: false },
      },
    );
    expect(result.current.visible).toBe(false);
    await rerender({ ready: true });
    expect(result.current.visible).toBe(true);
    await act(() => result.current.skip());
    expect(result.current.visible).toBe(false);
  });
});
