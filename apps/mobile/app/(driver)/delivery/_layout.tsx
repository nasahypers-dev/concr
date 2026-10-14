import { Stack } from 'expo-router';
import { useThemeColors } from '@/ui';

/** Trip screen: a full-screen stack above the driver tabs (the tabs layout hides the tab bar). */
export default function DeliveryStackLayout() {
  const theme = useThemeColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}
    />
  );
}
