import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Screen, StateView } from '@/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('states.notFoundTitle') }} />
      <Screen>
        <StateView status="empty" title={t('states.notFoundTitle')} description="" />
        <Link href="/" className="self-center">
          <Text className="text-base font-semibold text-primary">{t('states.goHome')}</Text>
        </Link>
      </Screen>
    </>
  );
}
