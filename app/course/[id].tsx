import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useCourseStore } from '../../src/store/courseStore';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courses = useCourseStore((s) => s.courses);
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  const toggleEnrollment = useCourseStore((s) => s.toggleEnrollment);

  const course = courses.find((c) => String(c.id) === id);

  const enrollScale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);

  const enrollStyle = useAnimatedStyle(() => ({
    transform: [{ scale: enrollScale.value }],
  }));

  const bookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const handleEnroll = useCallback(() => {
    if (!course) return;
    enrollScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1),
    );
    void toggleEnrollment(course.id);

    if (!course.isEnrolled) {
      Alert.alert('Enrolled! 🎉', `You are now enrolled in "${course.title}"`);
    }
  }, [course, toggleEnrollment]);

  const handleBookmark = useCallback(() => {
    if (!course) return;
    bookmarkScale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
      withSpring(1),
    );
    void toggleBookmark(course.id);
  }, [course, toggleBookmark]);

  const handleViewContent = useCallback(() => {
    if (!course) return;
    router.push({
      pathname: '/course/webview',
      params: { courseId: String(course.id), title: course.title },
    });
  }, [course]);

  if (!course) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-white text-lg">Course not found</Text>
      </View>
    );
  }

  const discountedPrice = course.price * (1 - course.discountPercentage / 100);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <Animated.View style={bookmarkStyle}>
              <TouchableOpacity onPress={handleBookmark} hitSlop={8}>
                <Text style={{ fontSize: 22 }}>
                  {course.isBookmarked ? '🔖' : '🤍'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Hero image */}
          <Image
            source={{ uri: course.thumbnail }}
            style={{ width: '100%', height: 240 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          <View className="px-4 py-6 gap-4">

            {/* Category + rating */}
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              className="flex-row items-center justify-between"
            >
              <View className="bg-primary-500/20 rounded-full px-3 py-1">
                <Text className="text-primary-400 text-xs font-medium capitalize">
                  {course.category}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text style={{ fontSize: 14 }}>⭐</Text>
                <Text className="text-yellow-400 font-semibold">{course.rating.toFixed(1)}</Text>
                <Text className="text-gray-500 text-sm">({course.stock} reviews)</Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text
              entering={FadeInDown.delay(100).springify()}
              className="text-white text-2xl font-bold font-heading"
            >
              {course.title}
            </Animated.Text>

            {/* Instructor */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              className="flex-row items-center gap-3 bg-surface-card rounded-xl p-3"
            >
              <Image
                source={{ uri: course.instructorAvatar as string }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
              <View>
                <Text className="text-gray-400 text-xs mb-0.5">Instructor</Text>
                <Text className="text-white font-semibold">{course.instructorName}</Text>
              </View>
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text className="text-white font-semibold text-lg mb-2">About this course</Text>
              <Text className="text-gray-400 text-base leading-relaxed">
                {course.description}
              </Text>
            </Animated.View>

            {/* Course images grid */}
            {course.images.length > 1 && (
              <Animated.View entering={FadeInDown.delay(250).springify()}>
                <Text className="text-white font-semibold text-lg mb-2">Preview</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                  {course.images.slice(0, 4).map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img }}
                      style={{ width: 140, height: 90, borderRadius: 8, marginRight: 10 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Price */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="flex-row items-center gap-3"
            >
              <Text className="text-white text-3xl font-bold">
                ${discountedPrice.toFixed(2)}
              </Text>
              {course.discountPercentage > 0 && (
                <>
                  <Text className="text-gray-500 text-lg line-through">
                    ${course.price.toFixed(2)}
                  </Text>
                  <View className="bg-green-500/20 rounded-full px-2 py-0.5">
                    <Text className="text-green-400 text-sm font-semibold">
                      -{Math.round(course.discountPercentage)}%
                    </Text>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </ScrollView>

        {/* Bottom actions */}
        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          className="px-4 py-4 flex-row gap-3 border-t border-gray-800/50 bg-surface"
        >
          <TouchableOpacity
            onPress={handleViewContent}
            className="flex-1 bg-surface-card border border-gray-700 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold">View Content</Text>
          </TouchableOpacity>

          <Animated.View style={enrollStyle} className="flex-1">
            <TouchableOpacity
              onPress={handleEnroll}
              className={`rounded-xl py-4 items-center ${
                course.isEnrolled ? 'bg-green-500/20 border border-green-500/30' : 'bg-primary-500'
              }`}
            >
              <Text
                className={`font-semibold ${
                  course.isEnrolled ? 'text-green-400' : 'text-white'
                }`}
              >
                {course.isEnrolled ? '✓ Enrolled' : 'Enroll Now'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}