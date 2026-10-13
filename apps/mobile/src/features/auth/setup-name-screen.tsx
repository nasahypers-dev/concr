import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useLogout, useUpdateProfile } from '@/features/auth/use-auth';
import { useErrorMessage } from '@/features/common/use-error-message';
import { Banner, Button, Screen, Text, TextField } from '@/ui';

/** Matches `updateProfileSchema.fullName` (max 80). */
const MAX_FULL_NAME = 80;

/**
 * Collects the customer's name and surname right after the first OTP sign-in (owner, 2026-10-12).
 * Saving marks the session complete (see `useUpdateProfile`), and the root layout moves on.
 */
export function SetupNameScreen() {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const errorMessage = useErrorMessage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [touched, setTouched] = useState(false);

  const first = firstName.trim();
  const last = lastName.trim();
  const fullName = `${first} ${last}`.trim();
  const valid = first !== '' && last !== '' && fullName.length <= MAX_FULL_NAME;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    updateProfile.mutate({ fullName });
  };

  return (
    <Screen scroll keyboard>
      <View className="gap-1 pt-2">
        <Text variant="title">{t('setup.title')}</Text>
        <Text tone="muted">{t('setup.subtitle')}</Text>
      </View>
      {/* No autocorrect or contact suggestions: the iOS suggestion bar would resize the keyboard
          while typing and nudge the pinned button. */}
      <TextField
        label={t('setup.firstName')}
        value={firstName}
        onChangeText={setFirstName}
        error={touched && first === '' ? t('sites.required') : undefined}
        icon="person-outline"
        autoCapitalize="words"
        autoCorrect={false}
        spellCheck={false}
        autoFocus
      />
      <TextField
        label={t('setup.lastName')}
        value={lastName}
        onChangeText={setLastName}
        error={touched && last === '' ? t('sites.required') : undefined}
        icon="people-outline"
        autoCapitalize="words"
        autoCorrect={false}
        spellCheck={false}
        onSubmitEditing={submit}
      />
      {updateProfile.isError ? (
        <Banner tone="danger" message={errorMessage(updateProfile.error)} />
      ) : null}
      <View className="flex-1" />
      <Button
        label={t('setup.continue')}
        icon="arrow-forward"
        loading={updateProfile.isPending}
        onPress={submit}
      />
      <Button
        variant="ghost"
        size="md"
        label={t('profile.logout')}
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </Screen>
  );
}
