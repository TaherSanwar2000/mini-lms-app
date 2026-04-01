import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8 py-16"
    >
      <Text style={{ fontSize: 48 }} className="mb-4">
        ⚠️
      </Text>
      <Text className="text-white text-xl font-semibold text-center mb-2">
        Something went wrong
      </Text>
      <Text className="text-gray-400 text-sm text-center mb-6">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-primary-500 rounded-xl px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
