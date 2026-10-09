import { Stack } from 'expo-router';
import { useThemeColors } from '@/ui';

export default function AuthLayout() {
  const theme = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.surface },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
