import { Stack } from 'expo-router';
import { useThemeColors } from '@/ui';

/** Order wizard (hidden from the tab bar): new/product → site → pump → schedule → review. */
export default function OrderWizardLayout() {
  const theme = useThemeColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}
    />
  );
}
