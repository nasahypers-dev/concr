import { useTranslation } from 'react-i18next';
import { Screen, StateView } from '@/ui';

export default function SitesScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['left', 'right']}>
      <StateView
        status="empty"
        title={t('customer.sitesEmpty')}
        description={t('customer.comingSoon')}
      />
    </Screen>
  );
}
