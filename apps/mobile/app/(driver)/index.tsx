import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Text, View } from 'react-native';
import { colors, Screen, StateView } from '@/ui';

/** Driver "Today": shift toggle (local only until Phase 2) + today's deliveries. */
export default function DriverTodayScreen() {
  const { t } = useTranslation();
  const [onShift, setOnShift] = useState(false);
  return (
    <Screen edges={['left', 'right']}>
      <View className="flex-row items-center justify-between rounded-xl bg-surface-muted p-4">
        <Text className="text-lg font-semibold text-ink">
          {onShift ? t('driver.onShift') : t('driver.offShift')}
        </Text>
        <Switch
          value={onShift}
          onValueChange={setOnShift}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.surface}
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
