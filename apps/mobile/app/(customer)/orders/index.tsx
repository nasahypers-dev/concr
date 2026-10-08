import { useTranslation } from 'react-i18next';
import { Screen, StateView } from '@/ui';

export default function OrdersScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['left', 'right']}>
      <StateView
        status="empty"
        title={t('customer.ordersEmpty')}
        description={t('customer.comingSoon')}
      />
    </Screen>
  );
}
