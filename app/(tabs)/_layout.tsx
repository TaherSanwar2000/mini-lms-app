import { Tabs } from 'expo-router';
import { View, Text, Image, useColorScheme, Platform } from 'react-native';

const icons = {
  home: require('../../assets/tabs-icon/home.png'),
  explore: require('../../assets/tabs-icon/search.png'),
  bookmarks: require('../../assets/tabs-icon/save.png'),
  profile: require('../../assets/tabs-icon/user.png'),
};

function TabIcon({ icon, focused, label }: { icon: any; focused: boolean; label: string }) {
  return (
    <View className="items-center justify-start pt-4 w-32">
      <Image
        source={icon}
        resizeMode="contain"
        style={{
          width: 28,
          height: 28,
        }}
      />
      <Text
        className={`text-xs mt-0.5 ${focused ? 'text-primary-400 font-semibold' : 'text-gray-500'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tabBg = isDark ? '#1E293B' : '#FFFFFF';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          backgroundColor: tabBg,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,

          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.4 : 0.08,
              shadowRadius: 12,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        sceneStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.home} focused={focused} label="Home" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.explore} focused={focused} label="Explore" />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.bookmarks} focused={focused} label="Saved" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.profile} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
