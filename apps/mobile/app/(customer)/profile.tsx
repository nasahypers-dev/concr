import { type Locale, locales } from '@concr/shared';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';
import { useLogout, useMe, useUpdateProfile } from '@/features/auth/use-auth';
import { useSupplier } from '@/features/catalog/use-catalog';
import { useErrorMessage } from '@/features/common/use-error-message';
import { changeLocale } from '@/i18n';
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
  const [name, setName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const currentName = name ?? me.data?.fullName ?? '';
  const dirty = name !== null && name.trim() !== (me.data?.fullName ?? '');

  const saveName = () => {
    updateProfile.mutate(
      { fullName: currentName.trim() },
      {
        onSuccess: () => {
          setName(null);
          setSaved(true);
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
                setSaved(false);
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

      <Section title={t('profile.support')}>
        <Card compact>
          <ListRow
            icon="call-outline"
            title={t('profile.callSupplier')}
            subtitle={supplier.data?.supplier.phone}
            onPress={() => void Linking.openURL(`tel:${supplier.data?.supplier.phone ?? ''}`)}
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
