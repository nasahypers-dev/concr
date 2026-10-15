import { ErrorCode, isApiClientError } from '@concr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useDriverLogin } from '@/features/auth/use-auth';
import { useErrorMessage } from '@/features/common/use-error-message';
import { AppHeader, Banner, Button, Screen, Text, TextField } from '@/ui';

const MIN_LOGIN_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

/** Driver sign-in (D22, amended 2026-10-15): phone or e-mail + the password the supplier set. */
export default function DriverLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useDriverLogin();
  const errorMessage = useErrorMessage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const identifierInvalid = identifier.trim().length < MIN_LOGIN_LENGTH;
  const passwordInvalid = password.length < MIN_PASSWORD_LENGTH;

  const submit = async () => {
    setTouched(true);
    if (identifierInvalid || passwordInvalid) return;
    try {
      await login.mutateAsync({ login: identifier.trim(), password });
      // The session is stored in the mutation; the root layout switches to the driver tabs.
    } catch {
      // Shown by the banner below.
    }
  };

  const failure = login.isError
    ? isApiClientError(login.error) && login.error.code === ErrorCode.UNAUTHORIZED
      ? t('auth.driverLoginFailed')
      : errorMessage(login.error)
    : null;

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('auth.driverLoginTitle')} onBack={() => router.back()} />
      <Text tone="muted">{t('auth.driverLoginSubtitle')}</Text>
      <TextField
        label={t('auth.driverLoginField')}
        placeholder={t('auth.driverLoginPlaceholder')}
        value={identifier}
        onChangeText={(value) => {
          setIdentifier(value);
          if (login.isError) login.reset();
        }}
        error={touched && identifierInvalid ? t('sites.required') : undefined}
        icon="person-outline"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoFocus
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (login.isError) login.reset();
        }}
        error={touched && passwordInvalid ? t('auth.passwordTooShort') : undefined}
        icon="lock-closed-outline"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {failure ? <Banner tone="danger" message={failure} onClose={() => login.reset()} /> : null}
      <Text variant="bodySm" tone="subtle">
        {t('auth.driverLoginHint')}
      </Text>
      <View className="flex-1" />
      <Button label={t('auth.login')} loading={login.isPending} onPress={() => void submit()} />
    </Screen>
  );
}
