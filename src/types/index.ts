// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: {
    url: string;
    localPath: string;
  };
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Course / Product Types ───────────────────────────────────────────────────

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
  // Enriched fields
  instructorId?: number;
  instructorName?: string;
  instructorAvatar?: string;
  isBookmarked?: boolean;
  isEnrolled?: boolean;
  progress?: number;
}

export interface Instructor {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  picture: string;
  nat: string;
  location: {
    city: string;
    country: string;
  };
}

export interface CourseState {
  courses: Course[];
  bookmarks: number[];
  enrollments: number[];
  searchQuery: string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  data: {
    data: T[];
    page: number;
    limit: number;
    totalPages: number;
    previousPage: boolean;
    nextPage: boolean;
    serialNumberStartFrom: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    totalItems: number;
  };
  message: string;
  success: boolean;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface NotificationData {
  type: 'BOOKMARK_MILESTONE' | 'REMINDER' | 'ENROLLMENT' | 'PROGRESS';
  courseId?: number;
  message: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(tabs)': undefined;
  'course/[id]': { id: string };
  'course/webview': { courseId: string; title: string };
};

// ─── Theme Types ──────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeState {
  colorScheme: ColorScheme;
}

// ─── Network Types ────────────────────────────────────────────────────────────

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}