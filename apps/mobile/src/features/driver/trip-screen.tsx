import {
  checkDeliveryTransition,
  type ConcreteTimerState,
  DeliveryActor,
  DeliveryStatus,
  formatElapsed,
  nextDriverStatus,
} from '@concr/shared';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';
import { useSupplier } from '@/features/catalog/use-catalog';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useWindowLabel } from '@/features/orders/order-card';
import { siteContactLines } from '@/features/orders/order-summary';
import { formatPhoneAz, formatTime, formatVolume } from '@/lib/format';
import { type NavigationApp, navigationLinks } from '@/lib/navigation';
import {
  AppHeader,
  Banner,
  Button,
  Card,
  Icon,
  ListRow,
  MapView,
  Screen,
  Scroll,
  Section,
  Sheet,
  Skeleton,
  StateView,
  StatusBadge,
  Text,
} from '@/ui';
import { CompleteSheet } from './complete-sheet';
import { ReasonSheet } from './reason-sheet';
import { useConcreteTimer } from './use-concrete-timer';
import { useCompleteDelivery, useDriverDelivery, useSetDeliveryStatus } from './use-driver';
import { useTripTracking } from './use-trip-tracking';

export interface TripScreenProps {
  id: string;
  onBack: () => void;
  /** After completion: back to the day's list. */
  onDone?: () => void;
  /** Injectable clock (fixtures live on a fixed day in tests). */
  now?: () => Date;
}

type SheetKind = 'navigate' | 'problem' | 'complete' | null;

/**
 * Spec §13 driver trip screen: where to go, whom to call, one big button for the next status
 * (56 px, haptic), the concrete timer after departure, foreground GPS while en route, and the
 * handover act (receiver + photos) at the end.
 */
export function TripScreen({ id, onBack, onDone, now = () => new Date() }: TripScreenProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const windowLabel = useWindowLabel();
  const trip = useDriverDelivery(id);
  const supplier = useSupplier();
  const setStatus = useSetDeliveryStatus(id);
  const complete = useCompleteDelivery(id);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const data = trip.data;
  const settings = supplier.data?.supplier.settings;
  const timer = useConcreteTimer({
    departedAt: data?.departedAt ?? null,
    endedAt: data?.completedAt ?? null,
    lifetimeMin: settings?.concreteLifetimeMin ?? null,
    now,
  });
  const tracking = useTripTracking(data, settings?.locationUpdateIntervalSec ?? 10);

  const header = (
    <View className="px-4">
      <AppHeader
        title={
          data
            ? t('delivery.trip', { sequence: data.sequence, total: data.order.deliveriesTotal })
            : '…'
        }
        subtitle={data?.order.number}
        onBack={onBack}
      />
    </View>
  );

  if (trip.isPending) {
    return (
      <Screen bare>
        {header}
        <View className="gap-4 px-4">
          <Skeleton className="h-56 w-full" rounded="xl" />
          <Skeleton className="h-32 w-full" rounded="xl" />
        </View>
      </Screen>
    );
  }
  if (trip.isError || !data) {
    return (
      <Screen bare>
        {header}
        <StateView
          status="error"
          description={trip.error ? errorMessage(trip.error) : undefined}
          onRetry={() => void trip.refetch()}
        />
      </Screen>
    );
  }

  const next = nextDriverStatus(data.status);
  const canFail = checkDeliveryTransition(data.status, DeliveryStatus.FAILED, {
    actor: DeliveryActor.DRIVER,
    reason: 'x',
  }).allowed;
  const contact = siteContactLines(data.site.contactName, data.site.contactPhone);
  const links = navigationLinks(data.site.location);

  const primaryLabel = (to: DeliveryStatus): string => {
    switch (to) {
      case DeliveryStatus.LOADING:
        return t('driver.trip.start');
      case DeliveryStatus.EN_ROUTE:
        return t('driver.trip.depart');
      case DeliveryStatus.ARRIVED:
        return t('driver.trip.arrive');
      case DeliveryStatus.UNLOADING:
        return t('driver.trip.unload');
      default:
        return t('driver.trip.complete');
    }
  };

  const navigationLabel = (app: NavigationApp): string =>
    app === 'apple'
      ? t('driver.trip.appleMaps')
      : app === 'google'
        ? t('driver.trip.googleMaps')
        : t('driver.trip.waze');

  const advance = (to: DeliveryStatus) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus.mutate(
      { to },
      { onSuccess: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) },
    );
  };

  const onPrimary = () => {
    if (!next) return;
    if (next === DeliveryStatus.COMPLETED) setSheet('complete');
    else advance(next);
  };

  const terminalNote = (): string | null => {
    switch (data.status) {
      case DeliveryStatus.PLANNED:
        return t('driver.trip.notAssigned');
      case DeliveryStatus.COMPLETED:
        return t('driver.trip.completed');
      case DeliveryStatus.CANCELLED:
        return t('driver.trip.cancelled');
      case DeliveryStatus.FAILED:
        return data.failReason
          ? `${t('driver.trip.failed')} · ${t('timeline.reason', { reason: data.failReason })}`
          : t('driver.trip.failed');
      default:
        return null;
    }
  };

  const times: { key: string; label: string; at: string | null }[] = [
    { key: 'departed', label: t('driver.trip.departed'), at: data.departedAt },
    { key: 'arrived', label: t('driver.trip.arrived'), at: data.arrivedAt },
    { key: 'unloadStarted', label: t('driver.trip.unloadStarted'), at: data.unloadStartedAt },
    { key: 'completed', label: t('driver.trip.completedAt'), at: data.completedAt },
  ].filter((row) => row.at !== null);

  return (
    <Screen bare>
      {header}
      <Scroll contentContainerClassName="gap-4 px-4 pb-4">
        <View className="flex-row items-center justify-between">
          <StatusBadge kind="delivery" status={data.status} size="md" />
          {tracking === 'on' ? (
            <View className="flex-row items-center gap-1">
              <Icon name="radio-outline" size="sm" tone="success" />
              <Text variant="caption" tone="success">
                {t('driver.trip.gpsOn')}
              </Text>
            </View>
          ) : null}
        </View>

        {timer ? <ConcreteTimerCard state={timer} /> : null}
        {tracking === 'denied' ? (
          <Banner
            tone="warning"
            message={t('driver.trip.gpsDenied')}
            actionLabel={t('sites.openSettings')}
            onAction={() => void Linking.openSettings()}
          />
        ) : null}
        {tracking === 'error' ? (
          <Banner tone="warning" message={t('driver.trip.gpsError')} />
        ) : null}

        <MapView
          className="h-56"
          plant={supplier.data?.plant.location ?? null}
          plantLogoUrl={supplier.data?.supplier.logoUrl ?? null}
          site={data.site.location}
          trucks={
            data.lastLocation
              ? [
                  {
                    id: data.id,
                    lat: data.lastLocation.lat,
                    lng: data.lastLocation.lng,
                    heading: data.lastHeading,
                  },
                ]
              : []
          }
          testID="trip-map"
        />

        <Section title={t('driver.trip.site')}>
          <Card compact>
            <ListRow
              icon="location-outline"
              title={data.site.name}
              subtitle={data.site.addressLine}
            />
            {data.site.accessNotes ? (
              <ListRow
                icon="information-circle-outline"
                title={t('sites.accessNotes')}
                subtitle={data.site.accessNotes}
              />
            ) : null}
            <ListRow
              icon="call-outline"
              title={contact.title}
              subtitle={contact.subtitle}
              right={
                <Button
                  size="sm"
                  variant="secondary"
                  icon="call"
                  label={t('delivery.call')}
                  onPress={() => void Linking.openURL(`tel:${data.site.contactPhone}`)}
                />
              }
            />
          </Card>
          <Button
            variant="secondary"
            size="md"
            icon="navigate-outline"
            label={t('driver.trip.navigate')}
            onPress={() => setSheet('navigate')}
          />
        </Section>

        <Section title={t('driver.trip.facts')}>
          <Card compact>
            <ListRow
              icon="cube-outline"
              title={t('driver.trip.thisTrip', { volume: formatVolume(data.volumeM3) })}
              subtitle={t('driver.trip.ofOrder', {
                grade: data.order.productGrade,
                volume: formatVolume(data.order.totalVolumeM3),
              })}
            />
            <ListRow
              icon="water-outline"
              title={data.order.pumpRequired ? t('driver.trip.withPump') : t('order.noPump')}
            />
            <ListRow
              icon="time-outline"
              title={windowLabel(
                data.order.requestedDate,
                data.order.timeWindowStart,
                data.order.timeWindowEnd,
              )}
            />
            {data.order.customerNote ? (
              <ListRow
                icon="chatbox-ellipses-outline"
                title={t('wizard.note')}
                subtitle={data.order.customerNote}
              />
            ) : null}
            <ListRow
              icon="receipt-outline"
              title={data.order.number}
              subtitle={formatPhoneAz(data.order.customerPhone)}
            />
          </Card>
        </Section>

        {times.length > 0 ? (
          <Section title={t('driver.trip.times')}>
            <Card compact>
              {times.map((row) => (
                <ListRow
                  key={row.key}
                  icon="checkmark-circle-outline"
                  title={row.label}
                  right={<Text weight="medium">{formatTime(row.at ?? '')}</Text>}
                />
              ))}
            </Card>
          </Section>
        ) : null}

        {data.document ? (
          <Card compact>
            <ListRow
              icon="document-text-outline"
              title={t('delivery.document', { number: data.document.number })}
              subtitle={t('delivery.receivedBy', { name: data.document.receivedByName })}
            />
          </Card>
        ) : null}

        {setStatus.isError ? (
          <Banner
            tone="danger"
            message={errorMessage(setStatus.error)}
            onClose={() => setStatus.reset()}
          />
        ) : null}
      </Scroll>

      <View className="gap-2 border-t border-border px-4 pt-3 pb-4 dark:border-border-dark">
        {next ? (
          <Button
            label={primaryLabel(next)}
            icon={next === DeliveryStatus.COMPLETED ? 'checkmark-circle' : 'arrow-forward'}
            loading={setStatus.isPending}
            onPress={onPrimary}
          />
        ) : (
          <Text tone="muted" className="text-center">
            {terminalNote()}
          </Text>
        )}
        {canFail ? (
          <Button
            variant="outline"
            size="md"
            icon="alert-circle-outline"
            label={t('driver.trip.problem')}
            onPress={() => setSheet('problem')}
          />
        ) : null}
        {data.status === DeliveryStatus.COMPLETED ? (
          <Button
            variant="secondary"
            size="md"
            label={t('driver.trip.backToToday')}
            onPress={onDone ?? onBack}
          />
        ) : null}
      </View>

      {sheet === 'navigate' ? (
        <Sheet visible onClose={() => setSheet(null)} title={t('driver.trip.navigateTitle')}>
          <View className="gap-2">
            {links.map((link) => (
              <Button
                key={link.app}
                variant="secondary"
                size="md"
                label={navigationLabel(link.app)}
                onPress={() => {
                  setSheet(null);
                  void Linking.openURL(link.url);
                }}
              />
            ))}
          </View>
        </Sheet>
      ) : null}

      {sheet === 'problem' ? (
        <ReasonSheet
          title={t('driver.trip.problemTitle')}
          hint={t('driver.trip.problemHint')}
          label={t('driver.trip.problemReason')}
          submitLabel={t('driver.trip.problemSubmit')}
          pending={setStatus.isPending}
          error={setStatus.isError ? errorMessage(setStatus.error) : null}
          onClose={() => setSheet(null)}
          onSubmit={(reason) =>
            setStatus.mutate(
              { to: DeliveryStatus.FAILED, reason },
              { onSuccess: () => setSheet(null) },
            )
          }
        />
      ) : null}

      {sheet === 'complete' ? (
        <CompleteSheet
          pending={complete.isPending}
          error={complete.isError ? errorMessage(complete.error) : null}
          onClose={() => setSheet(null)}
          onSubmit={(input) =>
            complete.mutate(input, {
              onSuccess: () => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSheet(null);
              },
            })
          }
        />
      ) : null}
    </Screen>
  );
}

function ConcreteTimerCard({ state }: { state: ConcreteTimerState }) {
  const { t } = useTranslation();
  const tone =
    state.level === 'expired' ? 'danger' : state.level === 'warning' ? 'danger' : 'accent';
  const box =
    state.level === 'ok'
      ? 'bg-accent-soft dark:bg-accent-soft-dark'
      : state.level === 'warning'
        ? 'bg-warning-soft dark:bg-warning-soft-dark'
        : 'bg-danger-soft dark:bg-danger-soft-dark';
  const message =
    state.level === 'ok'
      ? t('driver.trip.concreteOk', { minutes: state.remainingMin })
      : state.level === 'warning'
        ? t('driver.trip.concreteWarning', { minutes: state.remainingMin })
        : t('driver.trip.concreteExpired');
  return (
    <View className={`flex-row items-center justify-between rounded-2xl px-4 py-3 ${box}`}>
      <View className="flex-1 gap-0.5">
        <Text variant="caption" tone="muted">
          {t('driver.trip.concrete')}
        </Text>
        <Text variant="bodySm" weight="medium" tone={tone}>
          {message}
        </Text>
      </View>
      <Text variant="display" weight="bold" tone={tone} accessibilityLabel="concrete-timer">
        {formatElapsed(state.elapsedSec)}
      </Text>
    </View>
  );
}
