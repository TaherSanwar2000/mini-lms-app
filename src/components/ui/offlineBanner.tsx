import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Text, View } from 'react-native';
import { useEffect } from 'react';
import { useNetworkState } from '../../hooks/useNetworkState';

export function OfflineBanner() {
  const { isConnected } = useNetworkState();
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isConnected) {
      translateY.value = withSpring(0);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-60, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isConnected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animStyle}
      className="absolute top-0 left-0 right-0 z-50 bg-red-500 px-4 py-3 flex-row items-center justify-center gap-2"
    >
      <Text className="text-white font-semibold text-sm">
        📡 No internet connection
      </Text>
      <View className="bg-white/20 rounded-full px-2 py-0.5">
        <Text className="text-white text-xs">Offline mode</Text>
      </View>
    </Animated.View>
  );
}