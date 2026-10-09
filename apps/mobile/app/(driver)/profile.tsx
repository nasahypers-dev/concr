import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSessionStore } from '@/store/session.store';
import { Button, Screen, Text } from '@/ui';

export default function DriverProfileScreen() {
  const { t } = useTranslation();
  const clear = useSessionStore((state) => state.clear);
  return (
    <Screen edges={['left', 'right']}>
      <View className="flex-1 gap-2">
        <Text variant="title">{t('driver.profileTitle')}</Text>
        <Text tone="muted">{t('customer.comingSoon')}</Text>
      </View>
      <Button variant="secondary" label={t('common.back')} onPress={clear} />
    </Screen>
  );
}
