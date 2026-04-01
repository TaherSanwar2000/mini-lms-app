import apiClient from '../lib/apiClient';
import {
  API_ENDPOINTS,
  CACHE_TTL_MS,
  COURSES_PER_PAGE,
  STORAGE_KEYS,
} from '../constants/app.constants';
import type { Course, Instructor, PaginatedResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawProduct {
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
}

interface RawUser {
  id: number;
  name: { first: string; last: string };
  login: { username: string };
  email: string;
  phone: string;
  picture: { large: string; medium: string; thumbnail: string };
  nat: string;
  location: { city: string; country: string };
}

// ─── Course Service ───────────────────────────────────────────────────────────

export const courseService = {
  async fetchCourses(page = 1): Promise<{ courses: Course[]; hasMore: boolean }> {
    // Check cache on first page
    if (page === 1) {
      const cached = await courseService.getCachedCourses();
      if (cached) return cached;
    }

    const [productsRes, usersRes] = await Promise.all([
      apiClient.get<PaginatedResponse<RawProduct>>(API_ENDPOINTS.PRODUCTS, {
        params: { page, limit: COURSES_PER_PAGE },
      }),
      apiClient.get<PaginatedResponse<RawUser>>(API_ENDPOINTS.USERS, {
        params: { page: 1, limit: COURSES_PER_PAGE },
      }),
    ]);

    const products = productsRes.data.data.data;
    const users = usersRes.data.data.data;
    const hasMore = productsRes.data.data.hasNextPage;

    const courses: Course[] = products.map((product, index) => {
      const instructor = users[index % users.length];
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        stock: product.stock,
        brand: product.brand,
        category: product.category,
        thumbnail: product.thumbnail,
        images: product.images,
        instructorId: instructor?.id,
        instructorName: instructor ? `${instructor.name.first} ${instructor.name.last}` : 'Unknown',
        instructorAvatar: instructor?.picture?.medium ?? '',
        isBookmarked: false,
        isEnrolled: false,
        progress: 0,
      };
    });

    // Cache first page
    if (page === 1) {
      await courseService.cacheCourses({ courses, hasMore });
    }

    return { courses, hasMore };
  },

  async fetchInstructors(): Promise<Instructor[]> {
    const { data } = await apiClient.get<PaginatedResponse<RawUser>>(API_ENDPOINTS.USERS, {
      params: { limit: 20 },
    });

    return data.data.data.map((u) => ({
      id: u.id,
      name: `${u.name.first} ${u.name.last}`,
      username: u.login.username,
      email: u.email,
      phone: u.phone,
      picture: u.picture.large,
      nat: u.nat,
      location: {
        city: u.location.city,
        country: u.location.country,
      },
    }));
  },

  async getCachedCourses(): Promise<{ courses: Course[]; hasMore: boolean } | null> {
    try {
      const [cachedData, cachedTTL] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.COURSES_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.COURSES_CACHE_TTL),
      ]);

      if (!cachedData || !cachedTTL) return null;

      const ttl = parseInt(cachedTTL, 10);
      if (Date.now() - ttl > CACHE_TTL_MS) return null;

      return JSON.parse(cachedData) as { courses: Course[]; hasMore: boolean };
    } catch {
      return null;
    }
  },

  async cacheCourses(data: { courses: Course[]; hasMore: boolean }): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.COURSES_CACHE, JSON.stringify(data)),
        AsyncStorage.setItem(STORAGE_KEYS.COURSES_CACHE_TTL, Date.now().toString()),
      ]);
    } catch {
      // Non-critical - silent fail
    }
  },

  async getBookmarks(): Promise<number[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  },

  async saveBookmarks(bookmarks: number[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },

  async getEnrollments(): Promise<number[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLMENTS);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  },

  async saveEnrollments(enrollments: number[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
  },
};
