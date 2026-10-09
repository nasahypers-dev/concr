import { Stack } from 'expo-router';
import { useThemeColors } from '@/ui';

/** Sites tab: list → new / edit as a stack inside the tab. */
export default function SitesStackLayout() {
  const theme = useThemeColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}
    />
  );
}
