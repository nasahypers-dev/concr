import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Switch, View } from 'react-native';
import { useLogout } from '@/features/auth/use-auth';
import { useSupplier } from '@/features/catalog/use-catalog';
import { useErrorMessage } from '@/features/common/use-error-message';
import { truckLabel } from '@/features/driver/truck-label';
import { useDriverMe, useSetShift } from '@/features/driver/use-driver';
import { PreferenceSections } from '@/features/settings/preference-sections';
import { formatPhoneAz } from '@/lib/format';
import {
  Banner,
  Button,
  Card,
  ListRow,
  Screen,
  Section,
  Sheet,
  Skeleton,
  StateView,
  Text,
  useThemeColors,
} from '@/ui';

/** Driver profile (spec §13): who I am, my mixer, my shift, language, appearance, dispatcher, logout. */
export default function DriverProfileScreen() {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const me = useDriverMe();
  const setShift = useSetShift();
  const supplier = useSupplier();
  const logout = useLogout();
  const errorMessage = useErrorMessage();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const driver = me.data;
  const dispatchPhone = supplier.data?.supplier.dispatchPhone;
  const version = Constants.expoConfig?.version ?? '0.0.0';

  return (
    <Screen scroll edges={['left', 'right']}>
      {me.isPending ? (
        <Skeleton className="h-44 w-full" rounded="xl" />
      ) : me.isError || !driver ? (
        <StateView status="error" compact onRetry={() => void me.refetch()} />
      ) : (
        <Card compact>
          <ListRow
            icon="person-outline"
            title={driver.fullName}
            subtitle={formatPhoneAz(driver.phone)}
          />
          <ListRow
            icon="car-outline"
            title={t('delivery.truck')}
            subtitle={driver.truck ? truckLabel(driver.truck) : t('driver.noTruck')}
          />
          <ListRow
            icon="time-outline"
            title={driver.isOnShift ? t('driver.onShift') : t('driver.offShift')}
            right={
              <Switch
                value={driver.isOnShift}
                disabled={setShift.isPending}
                onValueChange={(value) => setShift.mutate({ onShift: value })}
                trackColor={{ true: theme.accent, false: theme.border }}
                thumbColor={theme.surface}
                accessibilityLabel={t('driver.onShift')}
              />
            }
          />
          {setShift.isError ? (
            <View className="pb-2">
              <Banner
                tone="danger"
                message={errorMessage(setShift.error)}
                onClose={() => setShift.reset()}
              />
            </View>
          ) : null}
        </Card>
      )}

      <PreferenceSections />

      <Section title={t('profile.support')}>
        <Card compact>
          <ListRow
            icon="call-outline"
            title={t('driver.callDispatcher')}
            subtitle={dispatchPhone ? formatPhoneAz(dispatchPhone) : undefined}
            onPress={() => {
              if (dispatchPhone) void Linking.openURL(`tel:${dispatchPhone}`);
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
