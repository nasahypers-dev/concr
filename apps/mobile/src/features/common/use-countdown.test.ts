import { act, renderHook } from '@testing-library/react-native';
import { formatCountdown, useCountdown } from './use-countdown';

describe('formatCountdown', () => {
  it('renders minutes and zero-padded seconds', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(59)).toBe('0:59');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(0)).toBe('0:00');
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down to zero, fires onExpire once and can restart', async () => {
    const onExpire = jest.fn();
    const { result } = await renderHook(() => useCountdown(3, onExpire));
    expect(result.current.remaining).toBe(3);
    await act(() => jest.advanceTimersByTime(1000));
    expect(result.current.remaining).toBe(2);
    await act(() => jest.advanceTimersByTime(2000));
    expect(result.current.remaining).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(3000));
    expect(onExpire).toHaveBeenCalledTimes(1);
    await act(() => result.current.restart());
    expect(result.current.remaining).toBe(3);
    await act(() => jest.advanceTimersByTime(3000));
    expect(onExpire).toHaveBeenCalledTimes(2);
  });
});
