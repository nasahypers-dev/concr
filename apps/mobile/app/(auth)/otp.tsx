import { OTP_CODE_LENGTH } from '@concr/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRequestOtp, useVerifyOtp } from '@/features/auth/use-auth';
import { useErrorMessage } from '@/features/common/use-error-message';
import { AppHeader, Banner, Button, Screen, Text, TextField } from '@/ui';

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone = '', devCode = '' } = useLocalSearchParams<{ phone?: string; devCode?: string }>();
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const errorMessage = useErrorMessage();
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);

  const canSubmit = new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`).test(code);

  const submit = async () => {
    if (!canSubmit) return;
    await verifyOtp.mutateAsync({ phone, code });
    // Session is set in the mutation; the root layout switches to the customer group.
  };

  const resend = async () => {
    setResent(false);
    await requestOtp.mutateAsync({ phone });
    setResent(true);
  };

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('auth.otpTitle')} onBack={() => router.back()} />
      <Text tone="muted">{t('auth.otpHint', { phone })}</Text>
      <TextField
        label={t('auth.otpTitle')}
        icon="key-outline"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_CODE_LENGTH}
        autoFocus
        hint={__DEV__ && devCode ? t('auth.devCodeHint', { code: devCode }) : undefined}
      />
      {verifyOtp.isError ? <Banner tone="danger" message={errorMessage(verifyOtp.error)} /> : null}
      {resent ? <Banner tone="success" message={t('auth.codeResent')} /> : null}
      <View className="flex-1" />
      <Button
        label={t('auth.verify')}
        disabled={!canSubmit}
        loading={verifyOtp.isPending}
        onPress={() => void submit()}
      />
      <Button
        variant="ghost"
        size="md"
        label={t('auth.resendCode')}
        loading={requestOtp.isPending}
        onPress={() => void resend()}
      />
    </Screen>
  );
}
