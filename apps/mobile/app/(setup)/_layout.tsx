import { Stack } from 'expo-router';
import { useThemeColors } from '@/ui';

/** Shown once after sign-up until the account has a name (D21). */
export default function SetupLayout() {
  const theme = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.surface },
      }}
    >
      <Stack.Screen name="name" />
    </Stack>
  );
}
