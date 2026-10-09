import { act, renderHook } from '@testing-library/react-native';
import { useAutoHide } from './use-auto-hide';

describe('useAutoHide', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('hides itself after the duration', async () => {
    const { result } = await renderHook(() => useAutoHide(6000));
    expect(result.current[0]).toBe(false);
    await act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    await act(() => jest.advanceTimersByTime(5999));
    expect(result.current[0]).toBe(true);
    await act(() => jest.advanceTimersByTime(1));
    expect(result.current[0]).toBe(false);
  });

  it('hide() cancels the pending timer and show() restarts it', async () => {
    const { result } = await renderHook(() => useAutoHide(6000));
    await act(() => result.current[1]());
    await act(() => result.current[2]());
    expect(result.current[0]).toBe(false);
    await act(() => jest.advanceTimersByTime(6000));
    expect(result.current[0]).toBe(false);
    await act(() => result.current[1]());
    await act(() => jest.advanceTimersByTime(3000));
    await act(() => result.current[1]());
    await act(() => jest.advanceTimersByTime(3000));
    expect(result.current[0]).toBe(true); // restarted at 3 s, so 6 s have not passed yet
    await act(() => jest.advanceTimersByTime(3000));
    expect(result.current[0]).toBe(false);
  });
});
