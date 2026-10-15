import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Icon, Screen, Text, colors } from '@/ui';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View className="gap-2">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Icon name="cube" size="xl" color={colors.accent} />
          </View>
          <Text variant="display" tone="primary" className="mt-2">
            {t('common.appName')}
          </Text>
          <Text variant="bodySm" weight="medium" tone="accent">
            {t('common.tagline')}
          </Text>
        </View>
        <View className="gap-2">
          <Text variant="title">{t('auth.welcomeTitle')}</Text>
          <Text tone="muted">{t('auth.welcomeSubtitle')}</Text>
        </View>
      </View>
      <View className="gap-2 pb-2">
        <Button
          label={t('auth.getStarted')}
          icon="arrow-forward"
          onPress={() => router.push('/phone')}
        />
        {/* Drivers have accounts made by the supplier (D22); they never go through the OTP flow. */}
        <Button
          variant="ghost"
          size="md"
          icon="car-outline"
          label={t('auth.enterAsDriver')}
          onPress={() => router.push('/driver-login')}
        />
      </View>
    </Screen>
  );
}
