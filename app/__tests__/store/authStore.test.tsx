import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { authService } from '../../../src/services/authService';

jest.mock('../../src/services/authService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

const mockUser = {
  _id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: { url: '', localPath: '' },
  role: 'USER' as const,
  isEmailVerified: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockTokens = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    const store = useAuthStore.getState();
    store.clearError();
    jest.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should login successfully and update state', async () => {
    mockAuthService.login.mockResolvedValueOnce({
      user: mockUser,
      tokens: mockTokens,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({ username: 'testuser', password: 'password123' });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.tokens).toEqual(mockTokens);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set error state on failed login', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      try {
        await result.current.login({ username: 'wrong', password: 'wrong' });
      } catch {
        // Expected
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should clear auth state on logout', async () => {
    mockAuthService.login.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
    mockAuthService.logout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({ username: 'testuser', password: 'password123' });
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.tokens).toBeNull();
  });

  it('should clear error when clearError is called', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Some error'));

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      try {
        await result.current.login({ username: 'x', password: 'y' });
      } catch {}
    });

    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());

    expect(result.current.error).toBeNull();
  });
});