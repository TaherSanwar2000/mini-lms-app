import { create } from 'zustand';
import { authService } from '../services/authService';
import { markSessionReady } from '../lib/apiClient';
import type { AuthState, LoginFormData, RegisterFormData, User } from '../types';

interface AuthActions {
  login: (credentials: LoginFormData) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await authService.login(credentials);
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(formData);
      set({ isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

 logout: async () => {
  set({ isLoading: true });

  try {
    await authService.logout();
  } catch (error) {
  } finally {
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }
},

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const [storedUser, storedTokens] = await Promise.all([
        authService.getStoredUser(),
        authService.getStoredTokens(),
      ]);

      if (storedUser && storedTokens) {
        // Set state first so the app renders authenticated immediately
        set({ user: storedUser, tokens: storedTokens, isAuthenticated: true });

        // ── Unblock all queued API calls NOW that tokens are in SecureStore ──
        markSessionReady();

        // Validate token in background — silently refresh if expired
        try {
          const freshUser = await authService.getCurrentUser();
          set({ user: freshUser, isLoading: false });
        } catch {
          // Token invalid — log out cleanly
          await authService.logout();
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        // No stored session — still mark ready so the app doesn't hang
        markSessionReady();
        set({ isLoading: false });
      }
    } catch {
      markSessionReady(); // Always unblock, even on unexpected errors
      set({ isLoading: false });
    }
  },

  updateUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));