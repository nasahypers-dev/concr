import { Stack } from 'expo-router';
import { useThemeColors } from '@/ui';

/** Orders tab: list → detail as a stack inside the tab. */
export default function OrdersStackLayout() {
  const theme = useThemeColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}
    />
  );
}
