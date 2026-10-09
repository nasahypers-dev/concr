import {
  customerCanCancel,
  type DeliveryDetail,
  isTrackingDeliveryStatus,
  windowStartToDate,
} from '@concr/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';
import { useSupplier } from '@/features/catalog/use-catalog';
import { useErrorMessage } from '@/features/common/use-error-message';
import { useWindowLabel } from '@/features/orders/order-card';
import { useOrderDraftStore } from '@/features/orders/order-draft.store';
import {
  useCancelOrder,
  useOrder,
  useOrderLive,
  useReorderDraft,
} from '@/features/orders/use-orders';
import { formatDateTime, formatVolume } from '@/lib/format';
import {
  AppHeader,
  Banner,
  Button,
  Card,
  Icon,
  ListRow,
  MapView,
  PriceBreakdown,
  Screen,
  Section,
  Sheet,
  Skeleton,
  StateView,
  StatusBadge,
  Text,
  TextField,
  Timeline,
  colors,
} from '@/ui';

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const order = useOrder(id);
  const supplier = useSupplier();
  const cancelOrder = useCancelOrder(id);
  const reorder = useReorderDraft();
  const loadDraft = useOrderDraftStore((s) => s.loadFrom);
  const errorMessage = useErrorMessage();
  const windowLabel = useWindowLabel();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const detail = order.data;
  const tracking = detail?.deliveries.some((d) => isTrackingDeliveryStatus(d.status)) ?? false;
  const live = useOrderLive(id, tracking);

  if (order.isPending) {
    return (
      <Screen>
        <AppHeader title={t('order.title', { number: '…' })} onBack={() => router.back()} />
        <Skeleton className="h-24 w-full" rounded="xl" />
        <Skeleton className="h-40 w-full" rounded="xl" />
        <Skeleton className="h-32 w-full" rounded="xl" />
      </Screen>
    );
  }
  if (order.isError || !detail) {
    return (
      <Screen>
        <AppHeader title={t('order.title', { number: '' })} onBack={() => router.back()} />
        <StateView
          status="error"
          description={order.error ? errorMessage(order.error) : undefined}
          onRetry={() => void order.refetch()}
        />
      </Screen>
    );
  }

  const settings = supplier.data?.supplier.settings;
  const canCancel =
    settings !== undefined &&
    customerCanCancel(
      detail.status,
      new Date(),
      windowStartToDate(detail.requestedDate, detail.timeWindowStart),
      settings.cancelCutoffHours,
    );
  const cancelBlockedByCutoff =
    settings !== undefined && !canCancel && detail.status === 'CONFIRMED';
  const trucks = Object.values(live.positions).map((p) => ({
    id: p.deliveryId,
    lat: p.lat,
    lng: p.lng,
    heading: p.heading,
  }));
  const activeDelivery = detail.deliveries.find((d) => isTrackingDeliveryStatus(d.status));
  const activeEta = activeDelivery
    ? (live.positions[activeDelivery.id]?.etaMinutes ?? activeDelivery.etaMinutes)
    : null;
  const documents = detail.deliveries.flatMap((d) => (d.document ? [d.document] : []));

  const submitCancel = async () => {
    await cancelOrder.mutateAsync(cancelReason.trim() === '' ? null : cancelReason.trim());
    setCancelOpen(false);
  };

  const submitReorder = async () => {
    const draft = await reorder.mutateAsync(detail.id);
    loadDraft(draft);
    router.navigate('/order/new/schedule');
  };

  return (
    <Screen scroll>
      <AppHeader title={t('order.title', { number: detail.number })} onBack={() => router.back()} />
      {created === '1' ? (
        <Banner
          tone="success"
          title={t('wizard.successTitle')}
          message={t('wizard.successBody', { number: detail.number })}
        />
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text variant="heading">
          {t('order.summary', {
            grade: detail.product.grade,
            volume: formatVolume(detail.volumeM3),
            slump: detail.slump,
          })}
        </Text>
        <StatusBadge kind="order" status={detail.status} />
      </View>
      {detail.cancelReason ? (
        <Banner
          tone="warning"
          message={t('order.cancelledReason', { reason: detail.cancelReason })}
        />
      ) : null}

      {tracking ? (
        <Section title={t('order.liveMap')}>
          <MapView
            className="h-64"
            plant={supplier.data?.plant.location ?? null}
            site={detail.site.location}
            trucks={trucks}
            testID="order-live-map"
          />
          {activeDelivery ? (
            <DeliveryRow
              delivery={activeDelivery}
              total={detail.deliveries.length}
              etaMinutes={activeEta}
              highlight
            />
          ) : null}
        </Section>
      ) : null}

      <Section title={t('order.details')}>
        <Card compact>
          <ListRow
            icon="location-outline"
            title={detail.site.name}
            subtitle={detail.site.addressLine}
          />
          <ListRow
            icon="time-outline"
            title={windowLabel(detail.requestedDate, detail.timeWindowStart, detail.timeWindowEnd)}
          />
          <ListRow
            icon="water-outline"
            title={
              detail.pumpOption
                ? t('order.pumpIncluded', { length: detail.pumpOption.boomLengthM })
                : t('order.noPump')
            }
          />
          <ListRow icon="card-outline" title={t(`payment.${detail.paymentMethod}`)} />
          {detail.customerNote ? (
            <ListRow
              icon="chatbox-ellipses-outline"
              title={t('wizard.note')}
              subtitle={detail.customerNote}
            />
          ) : null}
        </Card>
      </Section>

      {detail.deliveries.length > 0 ? (
        <Section title={t('order.deliveries')}>
          <Card compact>
            {detail.deliveries.map((delivery) => (
              <DeliveryRow
                key={delivery.id}
                delivery={delivery}
                total={detail.deliveries.length}
                etaMinutes={live.positions[delivery.id]?.etaMinutes ?? delivery.etaMinutes}
              />
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title={t('order.price')}>
        <Card>
          <PriceBreakdown
            breakdown={detail.pricing}
            grade={detail.product.grade}
            pumpRequired={detail.pumpRequired}
            pumpPriceKnown={!detail.pumpRequired || detail.pricing.pumpFee !== '0.00'}
          />
        </Card>
      </Section>

      {documents.length > 0 ? (
        <Section title={t('order.documents')}>
          <Card compact>
            {documents.map((doc) => (
              <ListRow
                key={doc.id}
                icon="document-text-outline"
                title={t('delivery.document', { number: doc.number })}
                subtitle={`${t('delivery.receivedBy', { name: doc.receivedByName })} · ${formatDateTime(doc.receivedAt)}`}
              />
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title={t('order.timeline')}>
        <Card>
          <Timeline events={detail.events} />
        </Card>
      </Section>

      <View className="gap-2 pb-4">
        {cancelBlockedByCutoff ? (
          <Banner
            tone="info"
            message={t('order.cancelTooLate', { hours: settings.cancelCutoffHours })}
          />
        ) : null}
        {canCancel ? (
          <Button
            variant="outline"
            label={t('order.cancel')}
            icon="close-circle-outline"
            onPress={() => setCancelOpen(true)}
          />
        ) : null}
        <Button
          variant="secondary"
          label={t('order.reorder')}
          icon="refresh-outline"
          loading={reorder.isPending}
          onPress={() => void submitReorder()}
        />
      </View>

      <Sheet
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t('order.cancelTitle')}
      >
        <View className="gap-4">
          <TextField
            label={t('order.cancelReason')}
            value={cancelReason}
            onChangeText={setCancelReason}
            multiline
          />
          {cancelOrder.isError ? (
            <Banner tone="danger" message={errorMessage(cancelOrder.error)} />
          ) : null}
          <Button
            variant="danger"
            label={t('order.cancelConfirm')}
            loading={cancelOrder.isPending}
            onPress={() => void submitCancel()}
          />
          <Button
            variant="ghost"
            size="md"
            label={t('common.back')}
            onPress={() => setCancelOpen(false)}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

function DeliveryRow({
  delivery,
  total,
  etaMinutes,
  highlight = false,
}: {
  delivery: DeliveryDetail;
  total: number;
  etaMinutes: number | null;
  highlight?: boolean;
}) {
  const { t } = useTranslation();
  const tracking = isTrackingDeliveryStatus(delivery.status);
  return (
    <View className={highlight ? 'rounded-xl bg-accent-soft p-3 dark:bg-accent-soft-dark' : 'py-2'}>
      <View className="flex-row items-center justify-between">
        <Text weight="semibold">
          {t('delivery.trip', { sequence: delivery.sequence, total })} ·{' '}
          {formatVolume(delivery.volumeM3)}
        </Text>
        <StatusBadge kind="delivery" status={delivery.status} size="sm" />
      </View>
      {tracking && etaMinutes !== null ? (
        <Text
          variant="bodySm"
          weight="medium"
          tone="none"
          className="mt-1 text-accent-strong dark:text-accent-light"
        >
          {delivery.status === 'ARRIVED'
            ? t('delivery.arrived')
            : t('delivery.eta', { minutes: etaMinutes })}
        </Text>
      ) : null}
      {delivery.driver ? (
        <View className="mt-1 flex-row items-center justify-between">
          <Text variant="bodySm" tone="muted">
            {t('delivery.driver')}: {delivery.driver.fullName}
            {delivery.truck ? ` · ${delivery.truck.plateNumber}` : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('delivery.call')}
            onPress={() => void Linking.openURL(`tel:${delivery.driver?.phone ?? ''}`)}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft dark:bg-surface-muted-dark"
          >
            <Icon name="call" size="sm" color={colors.ink} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
