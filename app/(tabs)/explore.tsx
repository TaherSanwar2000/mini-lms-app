import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCourseStore, selectFilteredCoursesMemo as selectFilteredCourses } from '../../src/store/courseStore';
import { CourseCard } from '../../src/components/ui/courseCard';
import { SearchBar } from '../../src/components/ui/searchBar';
import { LoadingView } from '../../src/components/ui/loadingView';
import { OfflineBanner } from '../../src/components/ui/offlineBanner';
import type { Course } from '../../src/types';

export default function ExploreScreen() {
    const courses = useCourseStore(selectFilteredCourses);
  const isLoading = useCourseStore((s) => s.isLoading);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(courses.map((c) => c.category))];
    return cats.sort();
  }, [courses]);

  const filtered = useMemo(() => {
    if (!selectedCategory) return courses;
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  const renderItem = useCallback(
    ({ item, index }: { item: Course; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
        <CourseCard course={item} />
      </Animated.View>
    ),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <OfflineBanner />

      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold font-heading mb-4">Explore</Text>
      </View>

      <SearchBar />

      <View style={{height:50}}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-2 border items-center justify-center ${
            !selectedCategory
              ? 'bg-primary-500 border-primary-500'
              : 'bg-surface-card border-gray-700'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              !selectedCategory ? 'text-white' : 'text-gray-400'
            }`}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            className={`rounded-full px-4 py-2 border items-center justify-center ${
              selectedCategory === cat
                ? 'bg-primary-500 border-primary-500'
                : 'bg-surface-card border-gray-700'
            }`}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                selectedCategory === cat ? 'text-white' : 'text-gray-400'
              }`}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
      {isLoading && filtered.length === 0 ? (
        <LoadingView count={3} />
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text className="text-gray-400 mt-4 text-center">
                No courses in this category yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

