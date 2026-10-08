import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { tabBarOptions } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

/** Customer tabs (spec §13): Home | My orders | Sites | Profile. */
export default function CustomerLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ ...tabBarOptions, headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home'), tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: t('nav.orders'), tabBarIcon: tabIcon('receipt-outline') }}
      />
      <Tabs.Screen
        name="sites"
        options={{ title: t('nav.sites'), tabBarIcon: tabIcon('location-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline') }}
      />
    </Tabs>
  );
}
