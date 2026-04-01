import { act, renderHook } from '@testing-library/react-native';
import { useCourseStore, selectFilteredCourses, selectBookmarkedCourses } from '../../../src/store/courseStore';
import { courseService } from '../../../src/services/courseService';
import { notificationService } from '../../../src/services/notificationService';

jest.mock('../../src/services/courseService');
jest.mock('../../src/services/notificationService');

const mockCourseService = courseService as jest.Mocked<typeof courseService>;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const makeCourse = (id: number, overrides = {}) => ({
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
  instructorName: 'John Doe',
  instructorAvatar: '',
  isBookmarked: false,
  isEnrolled: false,
  progress: 0,
  ...overrides,
});

describe('useCourseStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('should fetch and populate courses', async () => {
    const mockCourses = [makeCourse(1), makeCourse(2), makeCourse(3)];
    mockCourseService.fetchCourses.mockResolvedValueOnce({
      courses: mockCourses,
      hasMore: false,
    });
    mockCourseService.getBookmarks.mockResolvedValueOnce([]);
    mockCourseService.getEnrollments.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCourseStore());

    await act(async () => {
      await result.current.fetchCourses();
    });

    expect(result.current.courses).toHaveLength(3);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should toggle bookmark correctly', async () => {
    mockCourseService.saveBookmarks.mockResolvedValue(undefined);
    mockNotificationService.scheduleBookmarkMilestoneNotification.mockResolvedValue(undefined);

    useCourseStore.setState({ courses: [makeCourse(1)], bookmarks: [] });

    const { result } = renderHook(() => useCourseStore());

    await act(async () => {
      await result.current.toggleBookmark(1);
    });

    expect(result.current.bookmarks).toContain(1);
    expect(result.current.courses[0]?.isBookmarked).toBe(true);

    await act(async () => {
      await result.current.toggleBookmark(1);
    });

    expect(result.current.bookmarks).not.toContain(1);
    expect(result.current.courses[0]?.isBookmarked).toBe(false);
  });

  it('should trigger notification when bookmarks reach milestone', async () => {
    mockCourseService.saveBookmarks.mockResolvedValue(undefined);
    mockNotificationService.scheduleBookmarkMilestoneNotification.mockResolvedValue(undefined);

    const courses = Array.from({ length: 5 }, (_, i) => makeCourse(i + 1));
    useCourseStore.setState({ courses, bookmarks: [1, 2, 3, 4] });

    const { result } = renderHook(() => useCourseStore());

    await act(async () => {
      await result.current.toggleBookmark(5);
    });

    expect(mockNotificationService.scheduleBookmarkMilestoneNotification).toHaveBeenCalledWith(5);
  });

  it('should filter courses by search query', () => {
    useCourseStore.setState({
      courses: [
        makeCourse(1, { title: 'React Native Basics' }),
        makeCourse(2, { title: 'Advanced TypeScript' }),
        makeCourse(3, { title: 'React Hooks Deep Dive' }),
      ],
      searchQuery: 'react',
    });

    const filtered = selectFilteredCourses(useCourseStore.getState() as any);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.id)).toEqual([1, 3]);
  });

  it('should select bookmarked courses', () => {
    useCourseStore.setState({
      courses: [
        makeCourse(1, { isBookmarked: true }),
        makeCourse(2, { isBookmarked: false }),
        makeCourse(3, { isBookmarked: true }),
      ],
      bookmarks: [1, 3],
    });

    const bookmarked = selectBookmarkedCourses(useCourseStore.getState() as any);
    expect(bookmarked).toHaveLength(2);
    expect(bookmarked.map((c) => c.id)).toEqual([1, 3]);
  });
});