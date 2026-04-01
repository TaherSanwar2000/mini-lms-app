import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function SkeletonItem() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animStyle} className="bg-surface-card rounded-2xl mb-4 overflow-hidden">
      <View className="bg-gray-700 h-44 w-full" />
      <View className="p-4 gap-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-gray-700 w-7 h-7 rounded-full" />
          <View className="bg-gray-700 h-3 w-32 rounded-full" />
        </View>
        <View className="bg-gray-700 h-4 w-full rounded-full" />
        <View className="bg-gray-700 h-4 w-3/4 rounded-full" />
        <View className="bg-gray-700 h-3 w-full rounded-full" />
        <View className="flex-row justify-between mt-1">
          <View className="bg-gray-700 h-3 w-16 rounded-full" />
          <View className="bg-gray-700 h-3 w-16 rounded-full" />
        </View>
      </View>
    </Animated.View>
  );
}

export function LoadingView({ count = 3 }: { count?: number }) {
  return (
    <View className="px-4 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </View>
  );
}
