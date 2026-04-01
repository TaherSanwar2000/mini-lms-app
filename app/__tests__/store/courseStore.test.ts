import { act, renderHook } from '@testing-library/react-native';
import {
  useCourseStore,
  selectFilteredCoursesMemo,
  selectBookmarkedCourses,
  selectEnrolledCourses,
} from '../../../src/store/courseStore';
import { courseService } from '../../../src/services/courseService';
import { notificationService } from '../../../src/services/notificationService';

// ── Mock AsyncStorage so the native module error goes away ────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ── Mock Expo native modules ─────────────────────────────────────
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
}));

jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn(),
  getStatusAsync: jest.fn(),
  BackgroundFetchStatus: {
    Available: 'Available',
    Denied: 'Denied',
    Restricted: 'Restricted',
  },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('../../../src/services/courseService', () => ({
  courseService: {
    fetchCourses: jest.fn(),
    saveBookmarks: jest.fn(),
    saveEnrollments: jest.fn(),
    getBookmarks: jest.fn(),
    getEnrollments: jest.fn(),
  },
}));
jest.mock('../../../src/services/notificationService');

const mockCourseService = courseService as jest.Mocked<typeof courseService>;
const mockNotifService = notificationService as jest.Mocked<typeof notificationService>;

const makeCourse = (id: number, overrides: Record<string, any> = {}) => ({
  id,
  title: `Course ${id}`,
  description: `Description for course ${id}`,
  price: 29.99,
  discountPercentage: 10,
  rating: 4.5,
  stock: 100,
  brand: 'Acme',
  category: 'programming',
  thumbnail: `https://example.com/thumb${id}.jpg`,
  images: [],
  instructorId: id,
  instructorName: `Instructor ${id}`,
  instructorAvatar: '',
  isBookmarked: false,
  isEnrolled: false,
  progress: 0,
  ...overrides,
});

const resetStore = () =>
  useCourseStore.setState({
    courses: [],
    bookmarks: [],
    enrollments: [],
    searchQuery: '',
    isLoading: false,
    isRefreshing: false,
    error: null,
    page: 1,
    hasMore: true,
  });

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────
describe('useCourseStore — initial state', () => {
  it('has correct default values', () => {
    const { result } = renderHook(() => useCourseStore());
    expect(result.current.courses).toEqual([]);
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });
});

// ── fetchCourses ──────────────────────────────────────────────────────────────
describe('useCourseStore — fetchCourses', () => {
  it('loads and enriches courses', async () => {
    mockCourseService.fetchCourses.mockResolvedValueOnce({
      courses: [makeCourse(1), makeCourse(2)],
      hasMore: false,
    });
    useCourseStore.setState({ bookmarks: [1], enrollments: [2] });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.fetchCourses(); });

    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses[0]?.isBookmarked).toBe(true);
    expect(result.current.courses[1]?.isEnrolled).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isRefreshing on pull-to-refresh', async () => {
    let resolve!: (v: any) => void;
    mockCourseService.fetchCourses.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useCourseStore());

    act(() => { void result.current.fetchCourses(true); });
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isLoading).toBe(false);

    await act(async () => { resolve({ courses: [], hasMore: false }); });
  });

  it('sets error on failure', async () => {
    mockCourseService.fetchCourses.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.fetchCourses(); });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('uses fallback error message for non-Error throws', async () => {
    mockCourseService.fetchCourses.mockRejectedValueOnce('timeout');
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.fetchCourses(); });

    expect(result.current.error).toBe('Failed to load courses.');
  });

  it('skips fetch when already loading', async () => {
    useCourseStore.setState({ isLoading: true });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.fetchCourses(); });

    expect(mockCourseService.fetchCourses).not.toHaveBeenCalled();
  });
});

// ── fetchMoreCourses ──────────────────────────────────────────────────────────
describe('useCourseStore — fetchMoreCourses', () => {
  it('appends new courses', async () => {
    useCourseStore.setState({ courses: [makeCourse(1)], page: 1, hasMore: true });
    mockCourseService.fetchCourses.mockResolvedValueOnce({
      courses: [makeCourse(2)],
      hasMore: false,
    });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.fetchMoreCourses(); });

    expect(result.current.courses).toHaveLength(2);
    expect(result.current.page).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('skips when hasMore is false', async () => {
    useCourseStore.setState({ hasMore: false });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.fetchMoreCourses(); });

    expect(mockCourseService.fetchCourses).not.toHaveBeenCalled();
  });
});

// ── toggleBookmark ────────────────────────────────────────────────────────────
describe('useCourseStore — toggleBookmark', () => {
  beforeEach(() => {
    mockCourseService.saveBookmarks.mockResolvedValue(undefined);
    mockNotifService.scheduleBookmarkMilestoneNotification.mockResolvedValue(undefined);
  });

  it('adds bookmark', async () => {
    useCourseStore.setState({ courses: [makeCourse(1)], bookmarks: [] });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.toggleBookmark(1); });

    expect(result.current.bookmarks).toContain(1);
    expect(result.current.courses[0]?.isBookmarked).toBe(true);
  });

  it('removes bookmark', async () => {
    useCourseStore.setState({
      courses: [makeCourse(1, { isBookmarked: true })],
      bookmarks: [1],
    });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.toggleBookmark(1); });

    expect(result.current.bookmarks).not.toContain(1);
    expect(result.current.courses[0]?.isBookmarked).toBe(false);
  });

  it('triggers notification at milestone of 5', async () => {
    const courses = Array.from({ length: 5 }, (_, i) => makeCourse(i + 1));
    useCourseStore.setState({ courses, bookmarks: [1, 2, 3, 4] });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.toggleBookmark(5); });

    expect(mockNotifService.scheduleBookmarkMilestoneNotification).toHaveBeenCalledWith(5);
  });

  it('does not trigger notification when below threshold', async () => {
    useCourseStore.setState({ courses: [makeCourse(1)], bookmarks: [] });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.toggleBookmark(1); });

    expect(mockNotifService.scheduleBookmarkMilestoneNotification).not.toHaveBeenCalled();
  });
});

// ── toggleEnrollment ──────────────────────────────────────────────────────────
describe('useCourseStore — toggleEnrollment', () => {
  beforeEach(() => {
    mockCourseService.saveEnrollments.mockResolvedValue(undefined);
  });

  it('enrolls a course', async () => {
    useCourseStore.setState({ courses: [makeCourse(1)], enrollments: [] });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.toggleEnrollment(1); });

    expect(result.current.enrollments).toContain(1);
    expect(result.current.courses[0]?.isEnrolled).toBe(true);
  });

  it('unenrolls a course', async () => {
    useCourseStore.setState({
      courses: [makeCourse(1, { isEnrolled: true })],
      enrollments: [1],
    });
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.toggleEnrollment(1); });

    expect(result.current.enrollments).not.toContain(1);
  });
});

// ── setSearchQuery / clearError ───────────────────────────────────────────────
describe('useCourseStore — setSearchQuery & clearError', () => {
  it('updates searchQuery', () => {
    const { result } = renderHook(() => useCourseStore());
    act(() => { result.current.setSearchQuery('react native'); });
    expect(result.current.searchQuery).toBe('react native');
  });

  it('clears error', () => {
    useCourseStore.setState({ error: 'Something broke' });
    const { result } = renderHook(() => useCourseStore());
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });
});

// ── loadPersistedData ─────────────────────────────────────────────────────────
describe('useCourseStore — loadPersistedData', () => {
  it('loads bookmarks and enrollments from storage', async () => {
    mockCourseService.getBookmarks.mockResolvedValueOnce([1, 2]);
    mockCourseService.getEnrollments.mockResolvedValueOnce([3]);
    const { result } = renderHook(() => useCourseStore());

    await act(async () => { await result.current.loadPersistedData(); });

    expect(result.current.bookmarks).toEqual([1, 2]);
    expect(result.current.enrollments).toEqual([3]);
  });
});

// ── Selectors ─────────────────────────────────────────────────────────────────
describe('selectFilteredCoursesMemo', () => {
  it('returns all courses when query is empty', () => {
    const courses = [makeCourse(1), makeCourse(2)];
    const result = selectFilteredCoursesMemo({ courses, searchQuery: '' } as any);
    expect(result).toBe(courses);
  });

  it('filters by title (case-insensitive)', () => {
    const courses = [
      makeCourse(1, { title: 'React Native Basics' }),
      makeCourse(2, { title: 'TypeScript Advanced' }),
    ];
    const result = selectFilteredCoursesMemo({ courses, searchQuery: 'REACT' } as any);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it('filters by instructor name', () => {
    const courses = [
      makeCourse(1, { instructorName: 'Jane Smith' }),
      makeCourse(2, { instructorName: 'Bob Jones' }),
    ];
    const result = selectFilteredCoursesMemo({ courses, searchQuery: 'jane' } as any);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    const courses = [makeCourse(1, { title: 'Python Basics' })];
    expect(selectFilteredCoursesMemo({ courses, searchQuery: 'java' } as any)).toHaveLength(0);
  });

  it('returns same reference when inputs unchanged (memoization)', () => {
    const courses = [makeCourse(1, { title: 'React' })];
    const state = { courses, searchQuery: 'react' } as any;
    expect(selectFilteredCoursesMemo(state)).toBe(selectFilteredCoursesMemo(state));
  });
});

describe('selectBookmarkedCourses', () => {
  it('returns only bookmarked courses', () => {
    const courses = [
      makeCourse(1, { isBookmarked: true }),
      makeCourse(2, { isBookmarked: false }),
      makeCourse(3, { isBookmarked: true }),
    ];
    const result = selectBookmarkedCourses({ courses } as any);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual([1, 3]);
  });

  it('returns same reference when courses unchanged', () => {
    const courses = [makeCourse(1, { isBookmarked: true })];
    const state = { courses } as any;
    expect(selectBookmarkedCourses(state)).toBe(selectBookmarkedCourses(state));
  });
});

describe('selectEnrolledCourses', () => {
  it('returns only enrolled courses', () => {
    const courses = [makeCourse(1, { isEnrolled: true }), makeCourse(2)];
    expect(selectEnrolledCourses({ courses } as any)).toHaveLength(1);
  });

  it('returns same reference when courses unchanged', () => {
    const courses = [makeCourse(1, { isEnrolled: true })];
    const state = { courses } as any;
    expect(selectEnrolledCourses(state)).toBe(selectEnrolledCourses(state));
  });
});
