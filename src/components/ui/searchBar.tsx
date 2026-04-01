import { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useCourseStore } from '../../store/courseStore';
import { useDebounce } from '../../hooks/useDebounce';

export function SearchBar() {
  const [localQuery, setLocalQuery] = useState('');

  // Get the action once via getState() so it never changes reference
  // and never appears in useEffect dependency arrays
  const setSearchQuery = useRef(useCourseStore.getState().setSearchQuery).current;

  const debouncedQuery = useDebounce(localQuery, 350);

  // Safe: debouncedQuery only changes after the debounce delay,
  // and setSearchQuery ref never changes — no loop possible
  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((text: string) => {
    setLocalQuery(text);
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setSearchQuery('');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="flex-row items-center bg-surface-card border border-gray-700 rounded-xl px-4 py-3 gap-3 mx-4 mb-4">
      <Text style={{ fontSize: 16 }}>🔍</Text>
      <TextInput
        className="flex-1 text-white text-base"
        placeholder="Search courses, instructors..."
        placeholderTextColor="#6B7280"
        value={localQuery}
        onChangeText={handleChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {localQuery.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
