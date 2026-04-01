import { useEffect } from 'react';
import { Stack, router, useSegments, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { useCourseStore } from '../src/store/courseStore';
import { notificationService } from '../src/services/notificationService';
import '../global.css';

SplashScreen.preventAutoHideAsync();

// ─── Redirect logic lives here, INSIDE the navigator ─────────────────────────
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (isLoading) return;

    // ✅ wait until navigation is ready
    if (!navigationRef.isReady()) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)'); 
    }
  }, [isAuthenticated, isLoading, segments, navigationRef]);

  return null;
}

// ─── Root Layout — only renders the navigator, no navigation calls here ───────
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { restoreSession } = useAuthStore();
  const { loadPersistedData } = useCourseStore();

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          restoreSession(),
          loadPersistedData(),
          notificationService.requestPermissions(),
          notificationService.updateLastOpened(),
          notificationService.registerBackgroundTask(),
        ]);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    void init();
  }, []);

  // Notification tap handler
  useEffect(() => {
    const sub = notificationService.addResponseListener((response) => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'BOOKMARK_MILESTONE') {
        router.push('/(tabs)/bookmarks');
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="course/[id]"
          options={{
            headerShown: true,
            title: 'Course Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="course/webview"
          options={{
            headerShown: true,
            title: 'Course Content',
            presentation: 'modal',
          }}
        />
      </Stack>
      <AuthGate />
    </GestureHandlerRootView>
  );
}