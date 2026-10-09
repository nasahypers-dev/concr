import { Stack } from 'expo-router';
import { colors } from '@/ui';

/** Sites tab: list → new / edit as a stack inside the tab. */
export default function SitesStackLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
