import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { CourseCard } from '../../../src/components/ui/courseCard';
import { useCourseStore } from '../../../src/store/courseStore';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../src/store/courseStore');

const mockToggleBookmark = jest.fn();

const mockCourse = {
  id: 1,
  title: 'React Native Mastery',
  description: 'Master React Native from basics to advanced patterns',
  price: 49.99,
  discountPercentage: 20,
  rating: 4.8,
  stock: 50,
  brand: 'TechEdu',
  category: 'programming',
  thumbnail: 'https://example.com/thumb.jpg',
  images: [],
  instructorName: 'Jane Smith',
  instructorAvatar: 'https://example.com/avatar.jpg',
  isBookmarked: false,
  isEnrolled: false,
  progress: 0,
};

describe('CourseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCourseStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { toggleBookmark: mockToggleBookmark };
      return selector ? selector(state) : state;
    });
  });

  it('renders course title and description', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('React Native Mastery')).toBeTruthy();
    expect(screen.getByText(/Master React Native/)).toBeTruthy();
  });

  it('renders instructor name', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });

  it('renders discounted price', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('$39.99')).toBeTruthy();
  });

  it('renders rating', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('4.8')).toBeTruthy();
  });

  it('shows enrolled badge when enrolled', () => {
    const enrolledCourse = { ...mockCourse, isEnrolled: true };
    render(<CourseCard course={enrolledCourse} />);
    expect(screen.getByText('Enrolled')).toBeTruthy();
  });

  it('calls toggleBookmark when bookmark button is pressed', () => {
    render(<CourseCard course={mockCourse} />);
    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    fireEvent.press(bookmarkButton);
    expect(mockToggleBookmark).toHaveBeenCalledWith(1);
  });
});