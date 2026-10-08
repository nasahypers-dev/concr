import { OTP_CODE_LENGTH } from '@concr/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Screen, TextField } from '@/ui';

/** Phase 0 stub: UI only; verification against the API arrives in Phase 1. */
export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [code, setCode] = useState('');

  const canSubmit = new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`).test(code);

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text className="text-2xl font-semibold text-ink">{t('auth.otpTitle')}</Text>
        <Text className="text-base text-ink-muted">
          {t('auth.otpHint', { phone: phone ?? '' })}
        </Text>
      </View>
      <TextField
        label={t('auth.otpTitle')}
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_CODE_LENGTH}
        autoFocus
      />
      <Text className="text-sm text-ink-muted">{t('customer.comingSoon')}</Text>
      <View className="flex-1" />
      <Button label={t('auth.verify')} disabled={!canSubmit} onPress={() => undefined} />
      <Button variant="ghost" label={t('auth.resendCode')} onPress={() => undefined} />
      <Button variant="ghost" label={t('common.back')} onPress={() => router.back()} />
    </Screen>
  );
}
