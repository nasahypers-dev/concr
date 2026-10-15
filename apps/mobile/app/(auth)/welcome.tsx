import { DEV_DRIVER_PASSWORD } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import {
  DEV_CUSTOMER_PHONE,
  DEV_DRIVER_PHONE,
  DEV_OTP_CODE,
  useDriverLogin,
  useRequestOtp,
  useVerifyOtp,
} from '@/features/auth/use-auth';
import { Button, Icon, Screen, Text, colors } from '@/ui';

type TestAccount = 'customer' | 'driver';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const driverLogin = useDriverLogin();
  const [testLogin, setTestLogin] = useState<TestAccount | null>(null);

  // Development builds only: one tap signs a seeded test account in through the real flows.
  const signInAsTest = async (account: TestAccount) => {
    setTestLogin(account);
    try {
      if (account === 'customer') {
        await requestOtp.mutateAsync({ phone: DEV_CUSTOMER_PHONE });
        await verifyOtp.mutateAsync({ phone: DEV_CUSTOMER_PHONE, code: DEV_OTP_CODE });
      } else {
        await driverLogin.mutateAsync({ login: DEV_DRIVER_PHONE, password: DEV_DRIVER_PASSWORD });
      }
    } catch {
      // Test shortcut only; the regular screens report errors on their own.
    } finally {
      setTestLogin(null);
    }
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
        {/* Drivers have accounts made by the supplier (D22); they never go through the OTP flow. */}
        <Button
          variant="ghost"
          size="md"
          icon="car-outline"
          label={t('auth.enterAsDriver')}
          onPress={() => router.push('/driver-login')}
        />
        {__DEV__ ? (
          <View className="mt-2 gap-1 border-t border-border pt-3 dark:border-border-dark">
            <Button
              variant="ghost"
              size="sm"
              label={t('auth.testCustomerLogin')}
              loading={testLogin === 'customer'}
              onPress={() => void signInAsTest('customer')}
            />
            <Button
              variant="ghost"
              size="sm"
              label={t('auth.testDriverLogin')}
              loading={testLogin === 'driver'}
              onPress={() => void signInAsTest('driver')}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
