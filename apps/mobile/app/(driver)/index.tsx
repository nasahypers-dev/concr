import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';
import { Screen, StateView, Text, useThemeColors } from '@/ui';

/** Driver "Today": shift toggle (local only until Phase 2) + today's deliveries. */
export default function DriverTodayScreen() {
  const { t } = useTranslation();
  const [onShift, setOnShift] = useState(false);
  const theme = useThemeColors();
  return (
    <Screen edges={['left', 'right']}>
      <View className="flex-row items-center justify-between rounded-xl bg-surface-muted p-4 dark:bg-surface-muted-dark">
        <Text variant="subheading">{onShift ? t('driver.onShift') : t('driver.offShift')}</Text>
        <Switch
          value={onShift}
          onValueChange={setOnShift}
          trackColor={{ true: theme.accent, false: theme.border }}
          thumbColor={theme.surface}
          accessibilityLabel={t('driver.onShift')}
        />
      </View>
      <StateView
        status="empty"
        title={t('driver.todayEmpty')}
        description={t('customer.comingSoon')}
      />
    </Screen>
  );
}
