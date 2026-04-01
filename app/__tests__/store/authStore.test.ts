import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { authService } from '../../../src/services/authService';

jest.mock('../../../src/services/authService');
jest.mock('../../../src/lib/apiClient', () => ({
  markSessionReady: jest.fn(),
  default: {},
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

const mockUser = {
  _id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: { url: 'https://example.com/avatar.jpg', localPath: '' },
  role: 'USER' as const,
  isEmailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTokens = {
  accessToken: 'access-token-abc',
  refreshToken: 'refresh-token-xyz',
};

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────
describe('useAuthStore — initial state', () => {
  it('has correct default values', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.tokens).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('useAuthStore — login', () => {
  it('sets authenticated state on successful login', async () => {
    mockAuthService.login.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({ username: 'testuser', password: 'Password1!' });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.tokens).toEqual(mockTokens);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isLoading true while login is in progress', async () => {
    let resolveLogin!: (v: any) => void;
    mockAuthService.login.mockReturnValueOnce(new Promise((res) => { resolveLogin = res; }));
    const { result } = renderHook(() => useAuthStore());

    act(() => { void result.current.login({ username: 'testuser', password: 'Password1!' }); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveLogin({ user: mockUser, tokens: mockTokens }); });
  });

  it('sets error message on failed login', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      try { await result.current.login({ username: 'bad', password: 'wrong' }); }
      catch { /* expected */ }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('uses fallback error message for non-Error throws', async () => {
    mockAuthService.login.mockRejectedValueOnce('string error');
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      try { await result.current.login({ username: 'x', password: 'y' }); }
      catch { /* expected */ }
    });

    expect(result.current.error).toBe('Login failed. Please try again.');
  });

  it('re-throws so the calling component can catch it', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAuthStore());
    let caught: unknown;

    await act(async () => {
      try { await result.current.login({ username: 'x', password: 'y' }); }
      catch (e) { caught = e; }
    });

    expect(caught).toBeInstanceOf(Error);
  });
});

// ── Register ──────────────────────────────────────────────────────────────────
describe('useAuthStore — register', () => {
  it('completes without setting isAuthenticated', async () => {
    mockAuthService.register.mockResolvedValueOnce({ user: mockUser });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.register({
        username: 'newuser', email: 'new@example.com',
        password: 'Password1!', confirmPassword: 'Password1!',
      });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failed registration', async () => {
    mockAuthService.register.mockRejectedValueOnce(new Error('Username taken'));
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      try {
        await result.current.register({
          username: 'taken', email: 'x@x.com',
          password: 'Password1!', confirmPassword: 'Password1!',
        });
      } catch { /* expected */ }
    });

    expect(result.current.error).toBe('Username taken');
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
describe('useAuthStore — logout', () => {
  it('clears all auth state', async () => {
    useAuthStore.setState({ user: mockUser, tokens: mockTokens, isAuthenticated: true });
    mockAuthService.logout.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(result.current.tokens).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('clears state even if logout API throws', async () => {
    useAuthStore.setState({ user: mockUser, tokens: mockTokens, isAuthenticated: true });
    mockAuthService.logout.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ── Restore session ───────────────────────────────────────────────────────────
describe('useAuthStore — restoreSession', () => {
  it('restores session when stored credentials exist', async () => {
    mockAuthService.getStoredUser.mockResolvedValueOnce(mockUser);
    mockAuthService.getStoredTokens.mockResolvedValueOnce(mockTokens);
    mockAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.restoreSession(); });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it('stays unauthenticated when no stored session', async () => {
    mockAuthService.getStoredUser.mockResolvedValueOnce(null);
    mockAuthService.getStoredTokens.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.restoreSession(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears session when token validation fails', async () => {
    mockAuthService.getStoredUser.mockResolvedValueOnce(mockUser);
    mockAuthService.getStoredTokens.mockResolvedValueOnce(mockTokens);
    mockAuthService.getCurrentUser.mockRejectedValueOnce(new Error('401'));
    mockAuthService.logout.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.restoreSession(); });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
describe('useAuthStore — updateUser & clearError', () => {
  it('updateUser replaces user in state', () => {
    useAuthStore.setState({ user: mockUser });
    const updated = { ...mockUser, username: 'updated_name' };
    const { result } = renderHook(() => useAuthStore());

    act(() => { result.current.updateUser(updated); });

    expect(result.current.user?.username).toBe('updated_name');
  });

  it('clearError sets error to null', () => {
    useAuthStore.setState({ error: 'Some error' });
    const { result } = renderHook(() => useAuthStore());

    act(() => { result.current.clearError(); });

    expect(result.current.error).toBeNull();
  });
});
