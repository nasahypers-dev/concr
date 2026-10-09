import { Stack } from 'expo-router';
import { colors } from '@/ui';

/** Orders tab: list → detail as a stack inside the tab. */
export default function OrdersStackLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
