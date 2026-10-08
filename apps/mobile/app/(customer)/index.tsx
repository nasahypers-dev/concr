import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Screen, StateView } from '@/ui';

/** Customer home: order CTA + active order card (Phase 1) + recent orders (Phase 1). */
export default function CustomerHomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['left', 'right']}>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-ink">{t('customer.homeTitle')}</Text>
        <Text className="text-base text-ink-muted">{t('customer.comingSoon')}</Text>
      </View>
      <Button label={t('customer.orderCta')} onPress={() => undefined} />
      <StateView status="empty" title={t('customer.ordersEmpty')} />
    </Screen>
  );
}
