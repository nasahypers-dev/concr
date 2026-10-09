import { phoneE164Schema } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRequestOtp } from '@/features/auth/use-auth';
import { useErrorMessage } from '@/features/common/use-error-message';
import { AppHeader, Banner, Button, Screen, Text, TextField } from '@/ui';

/** Normalises "050 620 95 84" / "+994 50 ..." into E.164 before validation. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('994')) return `+${digits}`;
  if (digits.startsWith('0')) return `+994${digits.slice(1)}`;
  return `+994${digits}`;
}

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const errorMessage = useErrorMessage();
  const [phone, setPhone] = useState('+994');
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    const normalized = normalizePhone(phone);
    if (!phoneE164Schema.safeParse(normalized).success) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError(undefined);
    const result = await requestOtp.mutateAsync({ phone: normalized });
    router.push({ pathname: '/otp', params: { phone: normalized, devCode: result.devCode ?? '' } });
  };

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('auth.phoneTitle')} onBack={() => router.back()} />
      <Text tone="muted">{t('auth.phoneHint')}</Text>
      <TextField
        label={t('auth.phoneTitle')}
        icon="call-outline"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          if (error) setError(undefined);
        }}
        error={error}
        placeholder={t('auth.phonePlaceholder')}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
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
