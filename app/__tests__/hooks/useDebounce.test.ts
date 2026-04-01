import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../../src/hooks/useDebounce';

jest.useFakeTimers();
afterEach(() => jest.clearAllTimers());

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update before delay expires', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v, 300), {
      initialProps: { v: 'initial' },
    });
    rerender({ v: 'updated' });
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');
  });

  it('updates after delay expires', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v, 300), {
      initialProps: { v: 'initial' },
    });
    rerender({ v: 'updated' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('only applies last value when updated rapidly', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    rerender({ v: 'c' });
    rerender({ v: 'd' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('d');
  });

  it('resets timer when value changes mid-delay', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v, 300), {
      initialProps: { v: 'start' },
    });
    rerender({ v: 'mid' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ v: 'end' });
    act(() => {
      jest.advanceTimersByTime(200);
    }); // only 200ms since 'end'
    expect(result.current).toBe('start'); // not updated yet
    act(() => {
      jest.advanceTimersByTime(100);
    }); // now 300ms total
    expect(result.current).toBe('end');
  });

  it('uses 300ms default delay when not specified', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v), {
      initialProps: { v: 'first' },
    });
    rerender({ v: 'second' });
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('first');
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('works with number type', () => {
    const { result, rerender } = renderHook(({ v }: { v: number }) => useDebounce(v, 200), {
      initialProps: { v: 0 },
    });
    rerender({ v: 99 });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe(99);
  });

  it('does not throw when unmounted before delay expires', () => {
    const { rerender, unmount } = renderHook(({ v }: { v: string }) => useDebounce(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    unmount();
    expect(() =>
      act(() => {
        jest.advanceTimersByTime(300);
      }),
    ).not.toThrow();
  });
});
