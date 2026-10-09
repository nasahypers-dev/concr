import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import {
  DEV_CUSTOMER_PHONE,
  DEV_OTP_CODE,
  useRequestOtp,
  useVerifyOtp,
} from '@/features/auth/use-auth';
import { Button, Icon, Screen, Text, colors } from '@/ui';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  // Dev only: runs the real (mock) OTP flow for the seeded customer in one tap.
  const quickLogin = async () => {
    await requestOtp.mutateAsync({ phone: DEV_CUSTOMER_PHONE });
    await verifyOtp.mutateAsync({ phone: DEV_CUSTOMER_PHONE, code: DEV_OTP_CODE });
  };

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
        {__DEV__ ? (
          <Button
            variant="ghost"
            size="md"
            label={t('auth.devQuickLogin')}
            loading={requestOtp.isPending || verifyOtp.isPending}
            onPress={() => void quickLogin()}
          />
        ) : null}
      </View>
    </Screen>
  );
}
