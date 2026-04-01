import { useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCourseStore, selectFilteredCoursesMemo as selectFilteredCourses } from '../../src/store/courseStore';
import { useAuthStore } from '../../src/store/authStore';
import { CourseCard } from '../../src/components/ui/courseCard';
import { SearchBar } from '../../src/components/ui/searchBar';
import { OfflineBanner } from '../../src/components/ui/offlineBanner';
import { ErrorView } from '../../src/components/ui/errorView';
import { LoadingView } from '../../src/components/ui/loadingView';
import type { Course } from '../../src/types';


export default function HomeScreen() {
  const username = useAuthStore((s) => s.user?.username);

  // ── Subscribe to each primitive individually — no shallow needed ──
  const isLoading     = useCourseStore((s) => s.isLoading);
  const isRefreshing  = useCourseStore((s) => s.isRefreshing);
  const error         = useCourseStore((s) => s.error);
  const hasMore       = useCourseStore((s) => s.hasMore);
  const fetchCourses      = useCourseStore((s) => s.fetchCourses);
  const fetchMoreCourses  = useCourseStore((s) => s.fetchMoreCourses);
  const clearError        = useCourseStore((s) => s.clearError);

  // ── Selector: Zustand only re-renders when the returned array changes ──
  const courses = useCourseStore(selectFilteredCourses);

  useEffect(() => {
    void fetchCourses();
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchCourses(true);
  }, [fetchCourses]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) void fetchMoreCourses();
  }, [hasMore, isLoading, fetchMoreCourses]);

  const renderItem = useCallback(
    ({ item, index }: { item: Course; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <CourseCard course={item} />
      </Animated.View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Course) => String(item.id), []);

  const ListHeader = (
    <View className="px-4 pt-4 pb-2">
      <Text className="text-gray-400 text-sm mb-1">Good morning 👋</Text>
      <Text className="text-white text-2xl font-bold mb-4">{username ?? 'Learner'}</Text>
    </View>
  );

  const ListFooter =
    isLoading && courses.length > 0 ? (
      <View className="py-6 items-center">
        <ActivityIndicator color="#6366F1" />
      </View>
    ) : null;

  const EmptyComponent = !isLoading ? (
    <View className="items-center py-16 px-8">
      <Text style={{ fontSize: 48 }} className="mb-4">📚</Text>
      <Text className="text-white text-lg font-semibold text-center mb-2">No courses found</Text>
      <Text className="text-gray-400 text-sm text-center">
        Try a different search term or pull down to refresh
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <OfflineBanner />

      {isLoading && courses.length === 0 ? (
        <>
          {ListHeader}
          <SearchBar />
          <LoadingView count={4} />
        </>
      ) : error && courses.length === 0 ? (
        <ErrorView
          message={error}
          onRetry={() => {
            clearError();
            void fetchCourses();
          }}
        />
      ) : (
        <FlashList
          data={courses}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              {ListHeader}
              <SearchBar />
            </>
          }
          ListFooterComponent={ListFooter}
          ListEmptyComponent={EmptyComponent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}