import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { loginSchema, type LoginSchema } from '../../src/schemas';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function LoginScreen() {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(40);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(100, withSpring(0));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(300, withSpring(0));
  }, []);

  useEffect(() => {
    if (error) {
      shakeX.value = withSpring(10, { damping: 2, stiffness: 200 }, () => {
        shakeX.value = withSpring(0);
      });
    }
  }, [error]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const passwordRef = useRef<TextInput>(null);

  const onSubmit = async (data: LoginSchema) => {
    clearError();
    try {
      await login(data);
      router.replace('/(tabs)');
    } catch {
      // Error is handled in store
    }
  };

  return (
    <KeyboardAwareScrollView
         style={{ flex: 1 }}
         className="bg-surface"
         contentContainerStyle={{ flexGrow: 1 }}
         keyboardShouldPersistTaps="handled"
         enableOnAndroid={true}
         extraScrollHeight={Platform.OS === 'android' ? 40 : 20}
         showsVerticalScrollIndicator={false}
       >
        <View className="flex-1 px-6 pt-20 pb-10 justify-center">

          {/* Header */}
          <Animated.View style={titleStyle} className="mb-10">
            <View className="w-16 h-16 bg-primary-500 rounded-2xl items-center justify-center mb-6">
              <Text className="text-white text-2xl font-bold">L</Text>
            </View>
            <Text className="text-white text-3xl font-bold font-heading mb-2">
              Welcome back
            </Text>
            <Text className="text-gray-400 text-base">
              Sign in to continue learning
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[formStyle, shakeStyle]} className="gap-4">

            {/* Global error */}
            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View>
              <Text className="text-gray-400 text-sm mb-2 ml-1">Username</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-surface-card border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                    placeholder="Enter your username"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                )}
              />
              {errors.username ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">{errors.username.message}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View>
              <Text className="text-gray-400 text-sm mb-2 ml-1">Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={passwordRef}
                    className="bg-surface-card border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                    placeholder="Enter your password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    returnKeyType="done"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
              {errors.password ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">{errors.password.message}</Text>
              ) : null}
            </View>

            {/* Submit */}
            <TouchableOpacity
              className="bg-primary-500 rounded-xl py-4 items-center mt-2 active:opacity-80"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-400">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-400 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>
        </View>
   </KeyboardAwareScrollView>
  );
}