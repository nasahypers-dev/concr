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

/** Driver tabs (spec §13): Today | Profile. */
export default function DriverLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ ...tabBarOptions, headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.today'), tabBarIcon: tabIcon('today-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline') }}
      />
    </Tabs>
  );
}
