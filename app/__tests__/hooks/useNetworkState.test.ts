import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNetworkState } from '../../../src/hooks/useNetworkState';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

// Capture the listener registered by the hook so tests can simulate changes
let capturedListener: (state: any) => void = () => {};
const mockUnsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUnsubscribe.mockClear();

  mockNetInfo.addEventListener.mockImplementation((cb) => {
    capturedListener = cb;
    return mockUnsubscribe;
  });

  // Default: online — wrap in act so the .then() state update is captured
  mockNetInfo.fetch.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  } as any);
});

describe('useNetworkState', () => {
  it('returns online by default before fetch resolves', () => {
    // Initial state before the async fetch resolves
    mockNetInfo.fetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isConnected).toBe(true);
  });

  it('subscribes to NetInfo on mount', () => {
    renderHook(() => useNetworkState());
    expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('calls NetInfo.fetch on mount', async () => {
    renderHook(() => useNetworkState());
    await waitFor(() => {
      expect(mockNetInfo.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('updates state when listener fires offline event', async () => {
    const { result } = renderHook(() => useNetworkState());

    act(() => {
      capturedListener({ isConnected: false, isInternetReachable: false });
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isInternetReachable).toBe(false);
  });

  it('updates state when listener fires online event after offline', async () => {
    const { result } = renderHook(() => useNetworkState());

    act(() => {
      capturedListener({ isConnected: false, isInternetReachable: false });
    });
    expect(result.current.isConnected).toBe(false);

    act(() => {
      capturedListener({ isConnected: true, isInternetReachable: true });
    });
    expect(result.current.isConnected).toBe(true);
  });

  it('defaults null isConnected to false', () => {
    const { result } = renderHook(() => useNetworkState());

    act(() => {
      capturedListener({ isConnected: null, isInternetReachable: null });
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('updates state from fetch result', async () => {
    mockNetInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    } as any);

    const { result } = renderHook(() => useNetworkState());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('calls unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useNetworkState());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
