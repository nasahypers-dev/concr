import { Stack } from 'expo-router';
import { colors } from '@/ui';

/** Order wizard (hidden from the tab bar): new/product → site → pump → schedule → review. */
export default function OrderWizardLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
