import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, StateView, Text } from '@/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('states.notFoundTitle') }} />
      <Screen>
        <StateView status="empty" title={t('states.notFoundTitle')} description="" />
        <Link href="/" className="self-center">
          <Text weight="semibold" tone="primary">
            {t('states.goHome')}
          </Text>
        </Link>
      </Screen>
    </>
  );
}
