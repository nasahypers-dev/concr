import { OTP_CODE_LENGTH } from '@concr/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRequestOtp, useVerifyOtp } from '@/features/auth/use-auth';
import { formatCountdown, useCountdown } from '@/features/common/use-countdown';
import { useErrorMessage } from '@/features/common/use-error-message';
import { formatPhoneAz } from '@/lib/format';
import { AppHeader, Banner, Button, Screen, Text, TextField } from '@/ui';

/** A code is good for one minute; when it runs out a fresh one is sent automatically. */
const OTP_VALID_SEC = 60;

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

  const resend = async () => {
    setResent(false);
    verifyOtp.reset();
    try {
      await requestOtp.mutateAsync({ phone });
      setResent(true);
    } catch {
      // Shown by the banner below.
    } finally {
      countdown.restart();
    }
  };

  // Declared after `resend` is defined: the hook keeps the latest callback in a ref.
  const countdown = useCountdown(OTP_VALID_SEC, () => void resend());

  const submit = async () => {
    if (!canSubmit) return;
    setResent(false);
    try {
      await verifyOtp.mutateAsync({ phone, code });
      // Session is set in the mutation; the root layout switches to the next group.
    } catch {
      // Shown by the banner below; an unhandled rejection would raise the dev LogBox toast.
    }
  };

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('auth.otpTitle')} onBack={() => router.back()} />
      <Text tone="muted">{t('auth.otpHint', { phone: formatPhoneAz(phone) })}</Text>
      <TextField
        label={t('auth.otpTitle')}
        icon="key-outline"
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH));
          if (verifyOtp.isError) verifyOtp.reset();
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_CODE_LENGTH}
        autoFocus
        hint={__DEV__ && devCode ? t('auth.devCodeHint', { code: devCode }) : undefined}
      />
      {/* Just the time, like other OTP screens; tabular digits keep the width stable. */}
      <Text
        variant="bodySm"
        tone="muted"
        className="text-center"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatCountdown(countdown.remaining)}
      </Text>
      {verifyOtp.isError ? (
        <Banner
          tone="danger"
          message={errorMessage(verifyOtp.error)}
          onClose={() => verifyOtp.reset()}
        />
      ) : null}
      {requestOtp.isError ? (
        <Banner
          tone="danger"
          message={errorMessage(requestOtp.error)}
          onClose={() => requestOtp.reset()}
        />
      ) : null}
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
