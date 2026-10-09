import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { tabBarOptions } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return <Ionicons name={focused ? filled : outline} color={color} size={size} />;
  };
}

/** Customer tabs (spec §13): Home | My orders | Sites | Profile. The order wizard is a hidden route. */
export default function CustomerLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ ...tabBarOptions, headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home'), tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: t('nav.orders'), tabBarIcon: tabIcon('receipt-outline', 'receipt') }}
      />
      <Tabs.Screen
        name="sites"
        options={{ title: t('nav.sites'), tabBarIcon: tabIcon('location-outline', 'location') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline', 'person') }}
      />
      <Tabs.Screen name="order" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
