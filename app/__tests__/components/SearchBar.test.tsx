import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SearchBar } from '../../../src/components/ui/searchBar';

// ── Mock store ──────────────────────────────────────────────
const mockSetSearchQuery = jest.fn();

jest.mock('../../../src/store/courseStore', () => ({
  useCourseStore: Object.assign(
    jest.fn(() => ({})),
    {
      getState: jest.fn(() => ({ setSearchQuery: mockSetSearchQuery })),
    },
  ),
}));

// ── Mock debounce (instant) ─────────────────────────────────
jest.mock('../../../src/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

beforeEach(() => jest.clearAllMocks());

// ── Tests ───────────────────────────────────────────────────
describe('SearchBar (uncontrolled)', () => {
  it('renders with default placeholder', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search courses, instructors...')).toBeTruthy();
  });

  it('renders search icon', () => {
    render(<SearchBar />);
    expect(screen.getByText('🔍')).toBeTruthy();
  });

  it('does not show clear button initially', () => {
    render(<SearchBar />);
    expect(screen.queryByText('✕')).toBeNull();
  });

  it('shows clear button after typing', () => {
    render(<SearchBar />);
    fireEvent.changeText(screen.getByPlaceholderText('Search courses, instructors...'), 'react');
    expect(screen.getByText('✕')).toBeTruthy();
  });

  it('clears input when clear button is pressed', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search courses, instructors...');

    fireEvent.changeText(input, 'react');
    fireEvent.press(screen.getByText('✕'));

    expect(input.props.value).toBe('');
  });

  it('calls global store when typing', () => {
    render(<SearchBar />);
    fireEvent.changeText(screen.getByPlaceholderText('Search courses, instructors...'), 'expo');

    expect(mockSetSearchQuery).toHaveBeenCalledWith('expo');
  });

  it('calls global store with empty string when cleared', () => {
    render(<SearchBar />);
    fireEvent.changeText(screen.getByPlaceholderText('Search courses, instructors...'), 'expo');

    fireEvent.press(screen.getByText('✕'));

    expect(mockSetSearchQuery).toHaveBeenCalledWith('');
  });
});
