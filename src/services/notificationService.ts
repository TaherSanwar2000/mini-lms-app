import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BACKGROUND_TASK_NAME, NOTIFICATION_IDS, STORAGE_KEYS } from '../constants/app.constants';

// ─── Notification Handler ─────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Background Task ──────────────────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const lastOpened = await AsyncStorage.getItem(STORAGE_KEYS.LAST_OPENED);
    if (!lastOpened) return BackgroundFetch.BackgroundFetchResult.NoData;

    const hoursSinceLastOpen = (Date.now() - parseInt(lastOpened, 10)) / (1000 * 60 * 60);

    if (hoursSinceLastOpen >= 24) {
      await notificationService.scheduleReminderNotification();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    return finalStatus === 'granted';
  },

  async scheduleBookmarkMilestoneNotification(count: number): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.BOOKMARK_MILESTONE);

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.BOOKMARK_MILESTONE,
      content: {
        title: '🎉 Bookmark Milestone Reached!',
        body: `You've saved ${count} courses! Time to start learning.`,
        data: { type: 'BOOKMARK_MILESTONE' },
        color: '#6366F1',
      },
      trigger: null, // Immediate
    });
  },

  async scheduleReminderNotification(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.DAILY_REMINDER);

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.DAILY_REMINDER,
      content: {
        title: '📚 Miss learning?',
        body: "You haven't visited your courses in a while. Pick up where you left off!",
        data: { type: 'REMINDER' },
        color: '#6366F1',
      },
      trigger: null,
    });
  },

  async registerBackgroundTask(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
          minimumInterval: 60 * 60 * 24, // 24 hours
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    } catch {
      // Background tasks not supported on simulator
    }
  },

  async updateLastOpened(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPENED, Date.now().toString());
  },

  addNotificationListener(
    handler: (notification: Notifications.Notification) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(handler);
  },

  addResponseListener(
    handler: (response: Notifications.NotificationResponse) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },
};
