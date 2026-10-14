import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Switch, View } from 'react-native';
import { useErrorMessage } from '@/features/common/use-error-message';
import {
  Banner,
  Card,
  cn,
  colors,
  Icon,
  Screen,
  Skeleton,
  SkeletonList,
  StateView,
  Text,
  useThemeColors,
} from '@/ui';
import { TripCard } from './trip-card';
import { truckLabel } from './truck-label';
import { tripDays, useDriverDeliveries, useDriverMe, useSetShift } from './use-driver';

export interface DriverTodayScreenProps {
  onOpenTrip: (id: string) => void;
  /** Wall clock, injected for tests (the fixtures live on a fixed day). */
  now?: () => Date;
}

/** Driver "Today" (spec §13): shift switch with the assigned mixer, today's trips, tomorrow's preview. */
export function DriverTodayScreen({ onOpenTrip, now = () => new Date() }: DriverTodayScreenProps) {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const errorMessage = useErrorMessage();
  const me = useDriverMe();
  const setShift = useSetShift();
  const clock = now();
  const days = tripDays(clock);
  const today = useDriverDeliveries(days.today);
  const tomorrow = useDriverDeliveries(days.tomorrow);

  const onShift = me.data?.isOnShift ?? false;
  const truck = me.data?.truck ?? null;
  const tomorrowTrips = tomorrow.data ?? [];
  const refresh = () => {
    void Promise.all([me.refetch(), today.refetch(), tomorrow.refetch()]);
  };

  const header = (
    <View className="gap-4">
      <Card>
        <View className="flex-row items-center gap-3">
          <View
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full',
              onShift
                ? 'bg-accent-soft dark:bg-accent-soft-dark'
                : 'bg-surface-muted dark:bg-surface-muted-dark',
            )}
          >
            <Icon
              name={onShift ? 'flash' : 'moon-outline'}
              size="md"
              tone={onShift ? 'accentStrong' : 'muted'}
            />
          </View>
          <View className="flex-1 gap-0.5">
            {me.isPending ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <Text weight="semibold">{onShift ? t('driver.onShift') : t('driver.offShift')}</Text>
            )}
            {me.isSuccess ? (
              <Text variant="bodySm" tone="muted" numberOfLines={1}>
                {truck ? truckLabel(truck) : t('driver.noTruck')}
              </Text>
            ) : null}
          </View>
          <Switch
            value={onShift}
            disabled={!me.isSuccess || setShift.isPending}
            onValueChange={(value) => setShift.mutate({ onShift: value })}
            trackColor={{ true: theme.accent, false: theme.border }}
            thumbColor={theme.surface}
            accessibilityLabel={t('driver.onShift')}
          />
        </View>
        {me.isSuccess && !onShift ? (
          <Text variant="caption" tone="subtle" className="mt-3">
            {t('driver.shiftOffHint')}
          </Text>
        ) : null}
        {me.isError ? (
          <View className="mt-3">
            <Banner
              tone="danger"
              message={errorMessage(me.error)}
              actionLabel={t('states.retry')}
              onAction={refresh}
            />
          </View>
        ) : null}
        {setShift.isError ? (
          <View className="mt-3">
            <Banner
              tone="danger"
              message={errorMessage(setShift.error)}
              onClose={() => setShift.reset()}
            />
          </View>
        ) : null}
      </Card>
      <Text variant="subheading">{t('driver.todayTitle')}</Text>
    </View>
  );

  const empty = today.isPending ? (
    <SkeletonList count={2} />
  ) : today.isError ? (
    <StateView status="error" compact onRetry={refresh} />
  ) : (
    <StateView
      status="empty"
      compact
      icon="calendar-outline"
      title={t('driver.todayEmpty')}
      description={t('driver.todayEmptyHint')}
    />
  );

  const footer =
    tomorrowTrips.length > 0 ? (
      <View className="gap-3 pt-4">
        <Text variant="subheading" tone="muted">
          {t('driver.tomorrowTitle')}
        </Text>
        {tomorrowTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            now={clock}
            muted
            onPress={() => onOpenTrip(trip.id)}
          />
        ))}
      </View>
    ) : null;

  return (
    <Screen edges={['left', 'right']} bare>
      <FlatList
        data={today.data ?? []}
        keyExtractor={(trip) => trip.id}
        contentContainerClassName="gap-3 p-4"
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <TripCard trip={item} now={clock} onPress={() => onOpenTrip(item.id)} />
        )}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        refreshControl={
          <RefreshControl
            refreshing={today.isRefetching}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
      />
    </Screen>
  );
}
