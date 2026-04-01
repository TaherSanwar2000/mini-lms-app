import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Mini LMS',
  slug: 'mini-lms-app',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'minilms',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.minilms.app',
    infoPlist: {
      NSCameraUsageDescription: 'Used to update your profile picture.',
      NSPhotoLibraryUsageDescription: 'Used to select a profile picture.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
    package: 'com.minilms.app',
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'POST_NOTIFICATIONS',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6366F1',
        sounds: [],
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Mini LMS to access your photos.',
        cameraPermission: 'Allow Mini LMS to access your camera.',
      },
    ],
    'expo-background-fetch',
    'expo-task-manager',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.freeapi.app',
    eas: {
      projectId: '30a6c9c0-fef5-484f-a037-b1ff5f53fd95',
    },
  },
});
