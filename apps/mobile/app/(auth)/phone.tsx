import { phoneE164Schema } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRequestOtp } from '@/features/auth/use-auth';
import { useErrorMessage } from '@/features/common/use-error-message';
import { isCompleteAzLocal, toAzE164 } from '@/lib/phone';
import { AppHeader, Banner, Button, PhoneField, Screen, Text } from '@/ui';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const errorMessage = useErrorMessage();
  // Local digits only; the "+994" prefix is fixed in the field (owner, 2026-10-12).
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    const phone = toAzE164(digits);
    if (!isCompleteAzLocal(digits) || !phoneE164Schema.safeParse(phone).success) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError(undefined);
    const result = await requestOtp.mutateAsync({ phone });
    router.push({ pathname: '/otp', params: { phone, devCode: result.devCode ?? '' } });
  };

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('auth.phoneTitle')} onBack={() => router.back()} />
      <Text tone="muted">{t('auth.phoneHint')}</Text>
      <PhoneField
        label={t('auth.phoneTitle')}
        value={digits}
        onChangeText={(value) => {
          setDigits(value);
          if (error) setError(undefined);
        }}
        error={error}
        placeholder={t('auth.phonePlaceholder')}
        autoFocus
      />
      {requestOtp.isError ? (
        <Banner tone="danger" message={errorMessage(requestOtp.error)} />
      ) : null}
      <View className="flex-1" />
      <Button
        label={t('auth.sendCode')}
        loading={requestOtp.isPending}
        onPress={() => void submit()}
      />
    </Screen>
  );
}
