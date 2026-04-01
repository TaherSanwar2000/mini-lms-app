import { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../src/store/authStore';
import { registerSchema, type RegisterSchema } from '../../src/schemas';

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuthStore();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterSchema) => {
    clearError();
    try {
      await register(data);
      router.replace('/(auth)/login');
    } catch {
      // Error handled in store
    }
  };

  const fields: Array<{
    name: keyof RegisterSchema;
    label: string;
    placeholder: string;
    secure?: boolean;
    keyboardType?: 'default' | 'email-address';
    nextRef?: React.RefObject<TextInput | null>;
    ref?: React.RefObject<TextInput | null>;
  }> = [
    { name: 'username', label: 'Username', placeholder: 'Choose a username', nextRef: emailRef },
    { name: 'email', label: 'Email', placeholder: 'Enter your email', keyboardType: 'email-address', ref: emailRef, nextRef: passwordRef },
    { name: 'password', label: 'Password', placeholder: 'Create a strong password', secure: true, ref: passwordRef, nextRef: confirmRef },
    { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat your password', secure: true, ref: confirmRef },
  ];

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      className="bg-surface"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'android' ? 100 : 20}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 px-6 pt-16 pb-10">

        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-primary-400 text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold font-heading mb-2">
            Create account
          </Text>
          <Text className="text-gray-400 text-base">
            Start your learning journey today
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View className="gap-4">
          {fields.map((field) => (
            <View key={field.name}>
              <Text className="text-gray-400 text-sm mb-2 ml-1">{field.label}</Text>
              <Controller
                control={control}
                name={field.name}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={field.ref}
                    className="bg-surface-card border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                    placeholder={field.placeholder}
                    placeholderTextColor="#6B7280"
                    secureTextEntry={field.secure}
                    keyboardType={field.keyboardType ?? 'default'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={field.nextRef ? 'next' : 'done'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={() =>
                      field.nextRef
                        ? field.nextRef.current?.focus()
                        : handleSubmit(onSubmit)()
                    }
                  />
                )}
              />
              {errors[field.name] ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {errors[field.name]?.message}
                </Text>
              ) : null}
            </View>
          ))}

          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 items-center mt-2 active:opacity-80"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-400">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary-400 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}