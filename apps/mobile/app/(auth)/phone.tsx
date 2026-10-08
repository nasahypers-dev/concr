import { phoneE164Schema } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Screen, TextField } from '@/ui';

/** Phase 0 stub: validates the number locally; the OTP request arrives in Phase 1. */
export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState('+994');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!phoneE164Schema.safeParse(normalized).success) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError(undefined);
    router.push({ pathname: '/otp', params: { phone: normalized } });
  };

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text className="text-2xl font-semibold text-ink">{t('auth.phoneTitle')}</Text>
        <Text className="text-base text-ink-muted">{t('auth.phoneHint')}</Text>
      </View>
      <TextField
        label={t('auth.phoneTitle')}
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
      <View className="flex-1" />
      <Button label={t('auth.sendCode')} onPress={submit} />
      <Button variant="ghost" label={t('common.back')} onPress={() => router.back()} />
    </Screen>
  );
}
