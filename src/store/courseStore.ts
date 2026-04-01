import { create } from 'zustand';
import { courseService } from '../services/courseService';
import { notificationService } from '../services/notificationService';
import { BOOKMARK_MILESTONE } from '../constants/app.constants';
import type { Course, CourseState } from '../types';


interface CourseActions {
  fetchCourses: (refresh?: boolean) => Promise<void>;
  fetchMoreCourses: () => Promise<void>;
  toggleBookmark: (courseId: number) => Promise<void>;
  toggleEnrollment: (courseId: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  loadPersistedData: () => Promise<void>;
  clearError: () => void;
}

type CourseStore = CourseState & CourseActions;

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  bookmarks: [],
  enrollments: [],
  searchQuery: '',
  isLoading: false,
  isRefreshing: false,
  error: null,
  page: 1,
  hasMore: true,

  loadPersistedData: async () => {
    const [bookmarks, enrollments] = await Promise.all([
      courseService.getBookmarks(),
      courseService.getEnrollments(),
    ]);
    set({ bookmarks, enrollments });
  },

  fetchCourses: async (refresh = false) => {
    const state = get();
    if (state.isLoading || state.isRefreshing) return;
    set(refresh ? { isRefreshing: true, error: null } : { isLoading: true, error: null });
    try {
      const { courses, hasMore } = await courseService.fetchCourses(1);
      const { bookmarks, enrollments } = get();
      const enriched = courses.map((c) => ({
        ...c,
        isBookmarked: bookmarks.includes(c.id),
        isEnrolled: enrollments.includes(c.id),
      }));
      set({ courses: enriched, hasMore, page: 1, isLoading: false, isRefreshing: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load courses.';
      set({ error: message, isLoading: false, isRefreshing: false });
    }
  },

  fetchMoreCourses: async () => {
    const { isLoading, hasMore, page, courses } = get();
    if (isLoading || !hasMore) return;
    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const { courses: newCourses, hasMore: moreAvailable } =
        await courseService.fetchCourses(nextPage);
      const { bookmarks, enrollments } = get();
      const enriched = newCourses.map((c) => ({
        ...c,
        isBookmarked: bookmarks.includes(c.id),
        isEnrolled: enrollments.includes(c.id),
      }));
      set({ courses: [...courses, ...enriched], page: nextPage, hasMore: moreAvailable, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleBookmark: async (courseId) => {
    const { bookmarks, courses } = get();
    const isCurrentlyBookmarked = bookmarks.includes(courseId);
    const newBookmarks = isCurrentlyBookmarked
      ? bookmarks.filter((id) => id !== courseId)
      : [...bookmarks, courseId];
    const updatedCourses: Course[] = courses.map((c) =>
      c.id === courseId ? { ...c, isBookmarked: !isCurrentlyBookmarked } : c,
    );
    set({ bookmarks: newBookmarks, courses: updatedCourses });
    await courseService.saveBookmarks(newBookmarks);
    if (!isCurrentlyBookmarked && newBookmarks.length >= BOOKMARK_MILESTONE) {
      await notificationService.scheduleBookmarkMilestoneNotification(newBookmarks.length);
    }
  },

  toggleEnrollment: async (courseId) => {
    const { enrollments, courses } = get();
    const isEnrolled = enrollments.includes(courseId);
    const newEnrollments = isEnrolled
      ? enrollments.filter((id) => id !== courseId)
      : [...enrollments, courseId];
    const updatedCourses: Course[] = courses.map((c) =>
      c.id === courseId ? { ...c, isEnrolled: !isEnrolled } : c,
    );
    set({ enrollments: newEnrollments, courses: updatedCourses });
    await courseService.saveEnrollments(newEnrollments);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearError: () => set({ error: null }),
}));

// ─── Memo cache ────────────────────────────────────────────────────────────────
// Each selector keeps its own last-input / last-output pair.
// When inputs haven't changed (same object references), the cached array
// is returned — Zustand's === check sees no change and skips the re-render.

let _fCourses: Course[] = [];
let _fQuery = '';
let _fResult: Course[] = [];

export const selectFilteredCoursesMemo = (state: CourseStore): Course[] => {
  const { courses, searchQuery } = state;
  if (courses === _fCourses && searchQuery === _fQuery) return _fResult;
  _fCourses = courses;
  _fQuery = searchQuery;
  if (!searchQuery.trim()) {
    _fResult = courses;
  } else {
    const q = searchQuery.toLowerCase();
    _fResult = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.instructorName?.toLowerCase().includes(q) ?? false),
    );
  }
  return _fResult;
};

// Keep old name as alias so existing imports don't break
export const selectFilteredCourses = selectFilteredCoursesMemo;

let _bCourses: Course[] = [];
let _bResult: Course[] = [];

export const selectBookmarkedCourses = (state: CourseStore): Course[] => {
  const { courses } = state;
  if (courses === _bCourses) return _bResult;  // same ref → return cached
  _bCourses = courses;
  _bResult = courses.filter((c) => c.isBookmarked);
  return _bResult;
};

let _eCourses: Course[] = [];
let _eResult: Course[] = [];

export const selectEnrolledCourses = (state: CourseStore): Course[] => {
  const { courses } = state;
  if (courses === _eCourses) return _eResult;
  _eCourses = courses;
  _eResult = courses.filter((c) => c.isEnrolled);
  return _eResult;
};