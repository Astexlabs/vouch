import { useAuth } from '@clerk/clerk-expo';
import {
  Home09Icon,
  ShoppingBag02Icon,
} from '@hugeicons/core-free-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Icon } from '@/components/ui/icon';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  usePushNotifications();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#525252',
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopWidth: 1,
            borderTopColor: '#171717',
            paddingBottom: 6,
            paddingTop: 6,
            height: 60,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Expenses',
            tabBarIcon: ({ color }) => (
              <Icon icon={Home09Icon} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wishes"
          options={{
            title: 'Wish List',
            tabBarIcon: ({ color }) => (
              <Icon icon={ShoppingBag02Icon} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
