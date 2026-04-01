import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCourseStore, selectBookmarkedCourses } from '../../src/store/courseStore';
import { CourseCard } from '../../src/components/ui/courseCard';
import type { Course } from '../../src/types';
import { useCallback } from 'react';


export default function BookmarksScreen() {
  const bookmarked = useCourseStore(selectBookmarkedCourses);

  const renderItem = useCallback(
    ({ item, index }: { item: Course; index: number }) => (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 300)).springify()}>
        <CourseCard course={item} />
      </Animated.View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Course) => String(item.id), []);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Saved Courses</Text>
        <Text className="text-gray-400 text-sm mt-1">
          {bookmarked.length} {bookmarked.length === 1 ? 'course' : 'courses'} saved
        </Text>
      </View>

      {bookmarked.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 56 }}>🔖</Text>
          <Text className="text-white text-xl font-semibold text-center mt-4 mb-2">
            No saved courses
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            Tap the bookmark icon on any course to save it here for later
          </Text>
        </View>
      ) : (
        <FlashList
          data={bookmarked}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}