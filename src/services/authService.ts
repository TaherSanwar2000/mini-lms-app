import * as SecureStore from 'expo-secure-store';
import apiClient from '../lib/apiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/app.constants';
import type { ApiResponse, AuthTokens, LoginFormData, RegisterFormData, User } from '../types';

// ─── Auth API Calls ───────────────────────────────────────────────────────────

export const authService = {
  async login(credentials: LoginFormData): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post<
      ApiResponse<{ user: User; accessToken: string; refreshToken: string }>
    >(API_ENDPOINTS.LOGIN, credentials);

    const { user, accessToken, refreshToken } = data.data;
    const tokens: AuthTokens = { accessToken, refreshToken };
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
    ]);

    return { user, tokens };
  },

  async register(formData: RegisterFormData): Promise<{ user: User }> {
    const { confirmPassword: _cp, ...payload } = formData;
    const { data } = await apiClient.post<ApiResponse<User>>(API_ENDPOINTS.REGISTER, payload);
    return { user: data.data };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
      ]);
    }
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.ME);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(data.data));
    return data.data;
  },

  async getStoredUser(): Promise<User | null> {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  async getStoredTokens(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);

    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  async updateAvatar(imageUri: string): Promise<User> {
    const formData = new FormData();
    const fileName = imageUri.split('/').pop() ?? 'avatar.jpg';
    const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

    formData.append('avatar', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);

    const { data } = await apiClient.patch<ApiResponse<User>>(
      API_ENDPOINTS.UPDATE_AVATAR,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(data.data));
    return data.data;
  },
};
