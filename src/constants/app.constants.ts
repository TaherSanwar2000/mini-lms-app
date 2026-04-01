export const STORAGE_KEYS = {
  // SecureStore keys (sensitive)
  ACCESS_TOKEN: 'lms_access_token',
  REFRESH_TOKEN: 'lms_refresh_token',
  USER_DATA: 'lms_user_data',

  // AsyncStorage / MMKV keys (app data)
  BOOKMARKS: 'lms_bookmarks',
  ENROLLMENTS: 'lms_enrollments',
  COURSES_CACHE: 'lms_courses_cache',
  COURSES_CACHE_TTL: 'lms_courses_cache_ttl',
  COLOR_SCHEME: 'lms_color_scheme',
  LAST_OPENED: 'lms_last_opened',
  NOTIFICATION_PREFS: 'lms_notification_prefs',
} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/v1/users/login',
  REGISTER: '/api/v1/users/register',
  LOGOUT: '/api/v1/users/logout',
  REFRESH_TOKEN: '/api/v1/users/refresh-token',
  ME: '/api/v1/users/current-user',
  UPDATE_AVATAR: '/api/v1/users/avatar',

  // Public data
  PRODUCTS: '/api/v1/public/randomproducts',
  USERS: '/api/v1/public/randomusers',
} as const;

export const NOTIFICATION_IDS = {
  BOOKMARK_MILESTONE: 'bookmark-milestone',
  DAILY_REMINDER: 'daily-reminder',
} as const;

export const BACKGROUND_TASK_NAME = 'LMS_REMINDER_TASK';

export const BOOKMARK_MILESTONE = 5;

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const API_TIMEOUT_MS = 10_000;

export const MAX_RETRY_ATTEMPTS = 3;

export const COURSES_PER_PAGE = 10;