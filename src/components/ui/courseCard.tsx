import { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useCourseStore } from '../../store/courseStore';
import type { Course } from '../../types';

interface CourseCardProps {
  course: Course;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const CourseCard = memo(function CourseCard({ course }: CourseCardProps) {
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);  

  const bookmarkScale = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const bookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handleBookmark = useCallback(() => {
    bookmarkScale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 6 }),
    );
    void toggleBookmark(course.id);
  }, [course.id, toggleBookmark]);

  const handlePress = useCallback(() => {
    cardScale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withSpring(1),
    );
    router.push(`/course/${course.id}`);
  }, [course.id]);

  const discountedPrice = course.price * (1 - course.discountPercentage / 100);

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={handlePress}
        className="bg-surface-card rounded-2xl mb-4 overflow-hidden border border-gray-800/50"
      >
        {/* Thumbnail */}
        <View className="relative">
          <Image
            source={{ uri: course?.thumbnail as string }}
            style={{ width: '100%', height: 180 }}
            contentFit="contain"
            transition={300}
            cachePolicy="memory-disk"
          />
          {/* Category badge */}
          <View className="absolute top-3 left-3 bg-primary-500/90 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-medium capitalize">
              {course.category}
            </Text>
          </View>
          {/* Bookmark button */}
          <AnimatedTouchable
            style={[bookmarkStyle, { position: 'absolute', top: 8, right: 8 }]}
            onPress={handleBookmark}
            className="bg-black/50 rounded-full w-9 h-9 items-center justify-center"
            hitSlop={8}
          >
            <Text style={{ fontSize: 16 }}>
              {course.isBookmarked ? '🔖' : '🤍'}
            </Text>
          </AnimatedTouchable>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Instructor row */}
          <View className="flex-row items-center gap-2 mb-3">
            <Image
              source={{ uri: course?.instructorAvatar as string }}
              style={{ width: 28, height: 28, borderRadius: 14 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <Text className="text-gray-400 text-sm flex-1" numberOfLines={1}>
              {course.instructorName}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
            {course.title}
          </Text>

          {/* Description */}
          <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>
            {course.description}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text style={{ fontSize: 14 }}>⭐</Text>
              <Text className="text-yellow-400 font-semibold text-sm">
                {course.rating.toFixed(1)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {course.discountPercentage > 0 && (
                <Text className="text-gray-500 text-sm line-through">
                  ${course.price.toFixed(2)}
                </Text>
              )}
              <Text className="text-primary-400 font-bold text-base">
                ${discountedPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Enrolled badge */}
          {course.isEnrolled && (
            <View className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5 flex-row items-center gap-2">
              <Text style={{ fontSize: 12 }}>✅</Text>
              <Text className="text-green-400 text-xs font-medium">Enrolled</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});