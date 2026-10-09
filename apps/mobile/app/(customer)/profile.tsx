import { type Locale, locales } from '@concr/shared';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';
import { useLogout, useMe, useUpdateProfile } from '@/features/auth/use-auth';
import { useSupplier } from '@/features/catalog/use-catalog';
import { useAutoHide } from '@/features/common/use-auto-hide';
import { useErrorMessage } from '@/features/common/use-error-message';
import { changeLocale } from '@/i18n';
import { formatPhoneAz } from '@/lib/format';
import { THEME_PREFERENCES, type ThemePreference, useSettingsStore } from '@/store/settings.store';
import {
  Banner,
  Button,
  Card,
  ListRow,
  Screen,
  Section,
  SegmentedControl,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/ui';

const localeLabels: Record<Locale, string> = { az: 'Azərbaycan', ru: 'Русский', en: 'English' };

export default function CustomerProfileScreen() {
  const { t, i18n } = useTranslation();
  const me = useMe();
  const supplier = useSupplier();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const errorMessage = useErrorMessage();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [name, setName] = useState<string | null>(null);
  const [saved, showSaved, hideSaved] = useAutoHide();
  const [logoutOpen, setLogoutOpen] = useState(false);

  // The confirmation must not survive a tab switch.
  useFocusEffect(useCallback(() => () => hideSaved(), [hideSaved]));

  const currentName = name ?? me.data?.fullName ?? '';
  const dirty = name !== null && name.trim() !== (me.data?.fullName ?? '');

  const saveName = () => {
    updateProfile.mutate(
      { fullName: currentName.trim() },
      {
        onSuccess: () => {
          setName(null);
          showSaved();
        },
      },
    );
  };

  const switchLocale = async (locale: Locale) => {
    await changeLocale(locale);
    updateProfile.mutate({ locale });
  };

  const version = Constants.expoConfig?.version ?? '0.0.0';

  return (
    <Screen scroll keyboard>
      <Text variant="title" className="pt-2">
        {t('profile.title')}
      </Text>
      {me.isPending ? (
        <Skeleton className="h-24 w-full" rounded="xl" />
      ) : (
        <Card>
          <View className="gap-4">
            <TextField
              label={t('profile.name')}
              placeholder={t('profile.namePlaceholder')}
              value={currentName}
              onChangeText={(value) => {
                setName(value);
                hideSaved();
              }}
              icon="person-outline"
            />
            <TextField
              label={t('profile.phone')}
              value={me.data?.phone ?? ''}
              editable={false}
              icon="call-outline"
            />
            {updateProfile.isError ? (
              <Banner tone="danger" message={errorMessage(updateProfile.error)} />
            ) : null}
            {saved ? <Banner tone="success" message={t('profile.saved')} /> : null}
            {dirty ? (
              <Button
                size="md"
                label={t('profile.save')}
                loading={updateProfile.isPending}
                onPress={saveName}
              />
            ) : null}
          </View>
        </Card>
      )}

      <Section title={t('profile.language')}>
        <SegmentedControl<Locale>
          value={(i18n.language as Locale) ?? 'az'}
          onChange={(locale) => void switchLocale(locale)}
          options={locales.map((locale) => ({ value: locale, label: localeLabels[locale] }))}
        />
      </Section>

      <Section title={t('profile.appearance')}>
        <SegmentedControl<ThemePreference>
          value={theme}
          onChange={setTheme}
          options={THEME_PREFERENCES.map((value) => ({ value, label: t(`theme.${value}`) }))}
          accessibilityLabel={t('profile.appearance')}
        />
      </Section>

      <Section title={t('profile.support')}>
        <Card compact>
          <ListRow
            icon="call-outline"
            title={t('profile.callSupplier')}
            subtitle={
              supplier.data ? formatPhoneAz(supplier.data.supplier.dispatchPhone) : undefined
            }
            onPress={() =>
              void Linking.openURL(`tel:${supplier.data?.supplier.dispatchPhone ?? ''}`)
            }
          />
          <ListRow
            icon="globe-outline"
            title={supplier.data?.supplier.name ?? ''}
            subtitle={supplier.data?.supplier.website ?? undefined}
            onPress={() => {
              if (supplier.data?.supplier.website)
                void Linking.openURL(supplier.data.supplier.website);
            }}
          />
        </Card>
      </Section>

      <View className="gap-2 pb-4">
        <Button
          variant="outline"
          label={t('profile.logout')}
          icon="log-out-outline"
          onPress={() => setLogoutOpen(true)}
        />
        <Text variant="caption" tone="subtle" className="text-center">
          {t('profile.version', { version })}
        </Text>
      </View>

      <Sheet
        visible={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title={t('profile.logoutTitle')}
      >
        <View className="gap-3">
          <Button
            variant="danger"
            label={t('profile.logoutConfirm')}
            loading={logout.isPending}
            onPress={() => logout.mutate()}
          />
          <Button
            variant="ghost"
            size="md"
            label={t('common.back')}
            onPress={() => setLogoutOpen(false)}
          />
        </View>
      </Sheet>
    </Screen>
  );
}
