import { UserRole } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSessionStore } from '@/store/session.store';
import { Button, Screen } from '@/ui';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);

  // Dev-only shortcut until Phase 1 auth exists: jump into a role to see its tab group.
  const enterAs = (role: UserRole) =>
    setSession({ role, accessToken: 'dev-token', refreshToken: 'dev-refresh' });

  return (
    <Screen>
      <View className="flex-1 justify-center gap-6">
        <View className="gap-1">
          <Text className="text-5xl font-bold tracking-tight text-primary">
            {t('common.appName')}
          </Text>
          <Text className="text-base text-accent">{t('common.tagline')}</Text>
        </View>
        <View className="gap-2">
          <Text className="text-2xl font-semibold text-ink">{t('auth.welcomeTitle')}</Text>
          <Text className="text-base leading-6 text-ink-muted">{t('auth.welcomeSubtitle')}</Text>
        </View>
      </View>
      <View className="gap-2 pb-2">
        <Button label={t('auth.getStarted')} onPress={() => router.push('/phone')} />
        {__DEV__ ? (
          <>
            <Button
              variant="ghost"
              label={t('auth.devEnterAsCustomer')}
              onPress={() => enterAs(UserRole.CUSTOMER)}
            />
            <Button
              variant="ghost"
              label={t('auth.devEnterAsDriver')}
              onPress={() => enterAs(UserRole.DRIVER)}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
