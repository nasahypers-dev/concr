import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSessionStore } from '@/store/session.store';
import { Button, Screen } from '@/ui';

export default function DriverProfileScreen() {
  const { t } = useTranslation();
  const clear = useSessionStore((state) => state.clear);
  return (
    <Screen edges={['left', 'right']}>
      <View className="flex-1 gap-2">
        <Text className="text-2xl font-bold text-ink">{t('driver.profileTitle')}</Text>
        <Text className="text-base text-ink-muted">{t('customer.comingSoon')}</Text>
      </View>
      <Button variant="secondary" label={t('common.back')} onPress={clear} />
    </Screen>
  );
}
