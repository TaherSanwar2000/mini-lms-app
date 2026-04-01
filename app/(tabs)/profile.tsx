import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import {
  useCourseStore,
  selectBookmarkedCourses,
  selectEnrolledCourses,
} from '../../src/store/courseStore';
import { authService } from '../../src/services/authService';

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <View className="flex-1 bg-surface-card rounded-2xl p-4 items-center gap-1 border border-gray-800/50">
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-gray-400 text-xs text-center">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const bookmarked = useCourseStore(selectBookmarkedCourses);
  const enrolled = useCourseStore(selectEnrolledCourses);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  console.log(user);

  const handleAvatarUpdate = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);
      try {
        const updatedUser = await authService.updateAvatar(result.assets[0].uri);
        updateUser(updatedUser);
      } catch {
        Alert.alert('Upload failed', 'Could not update your profile picture. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  if (!user) return null;

  const isValidImageUrl = (url?: string) => {
    if (!url) return false;

    return (
      url.startsWith('http') && !url.includes('placeholder') && !url.includes('via.placeholder.com')
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} className="items-center px-6 pt-8 pb-6">
          <TouchableOpacity onPress={handleAvatarUpdate} className="relative mb-4">
            {isValidImageUrl(user.avatar?.url) ? (
              <Image
                source={{ uri: user.avatar.url }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary-500 items-center justify-center">
                <Text className="text-white text-3xl font-bold">
                  {user.username[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 rounded-full w-8 h-8 items-center justify-center ">
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Image
                  source={require('../../assets/images/edit.png')}
                  style={{ width: 26, height: 26, resizeMode: 'contain' }}
                />
              )}
            </View>
          </TouchableOpacity>

          <Text className="text-white text-2xl font-bold font-heading">{user.username}</Text>
          <Text className="text-gray-400 text-sm mt-1">{user.email}</Text>
          <View className="mt-2 bg-primary-500/20 rounded-full px-3 py-1">
            <Text className="text-primary-400 text-xs font-medium capitalize">
              {user.role.toLowerCase()}
            </Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="flex-row gap-3 mx-4 mb-6"
        >
          <StatCard label="Enrolled" value={enrolled.length} emoji="📚" />
          <StatCard label="Bookmarked" value={bookmarked.length} emoji="🔖" />
          <StatCard label="Completed" value={0} emoji="🏆" />
        </Animated.View>

        {/* Menu items */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="mx-4 bg-surface-card rounded-2xl border border-gray-800/50 overflow-hidden mb-4"
        >
          {[
            { label: 'My Courses', emoji: '🎓', onPress: () => {} },
            { label: 'Notifications', emoji: '🔔', onPress: () => {} },
            { label: 'Privacy Policy', emoji: '🔒', onPress: () => {} },
            { label: 'Help & Support', emoji: '💬', onPress: () => {} },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center px-4 py-4 gap-3 active:bg-surface-elevated ${
                index < arr.length - 1 ? 'border-b border-gray-800/50' : ''
              }`}
            >
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              <Text className="text-white text-base flex-1">{item.label}</Text>
              <Text className="text-gray-600">›</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mx-4 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl py-4 items-center active:opacity-80"
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text className="text-red-400 font-semibold text-base">Sign Out</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
