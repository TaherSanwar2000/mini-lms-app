import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import axiosRetry from 'axios-retry';
import * as SecureStore from 'expo-secure-store';
import { API_TIMEOUT_MS, MAX_RETRY_ATTEMPTS, STORAGE_KEYS } from '../constants/app.constants';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.freeapi.app';

// ─── Session-ready gate ───────────────────────────────────────────────────────
// Auth restore is async. Any API call that fires before restoreSession()
// finishes would hit the interceptor with null tokens.
// This promise resolves once the auth store signals it is ready.

let _resolveReady: () => void;
const sessionReady = new Promise<void>((resolve) => {
  _resolveReady = resolve;
});

/** Call this once in authStore.restoreSession() after tokens are loaded */
export function markSessionReady() {
  _resolveReady();
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Retry logic ──────────────────────────────────────────────────────────────

axiosRetry(apiClient, {
  retries: MAX_RETRY_ATTEMPTS,
  retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
  retryCondition: (error: AxiosError) => {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429;
  },
  onRetry: (retryCount, error) => {
    console.warn(`[API] Retry attempt ${retryCount} for ${error.config?.url}`);
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
// Wait for session to be ready before attaching the token.
// This prevents the race where a request fires before restoreSession() writes
// the access token to SecureStore.

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip the gate for the refresh-token endpoint itself to avoid deadlock
    const isRefreshCall = config.url?.includes('refresh-token');
    if (!isRefreshCall) {
      await sessionReady;
    }

    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor with token refresh ──────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Read refresh token fresh from SecureStore at the moment it's needed
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token means user is genuinely logged out — don't throw,
          // just reject cleanly so the calling screen can handle it
          processQueue(new Error('No refresh token'), null);
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${BASE_URL}/api/v1/users/refresh-token`,
          { refreshToken },
        );

        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only clear tokens if the refresh call itself returned 401/403
        // — not on network errors, so users aren't logged out on a bad connection
        const refreshErr = refreshError as AxiosError;
        if (
          refreshErr.response?.status === 401 ||
          refreshErr.response?.status === 403
        ) {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;