import { formatAzn, type OrderSummary } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { dayOffsetFromToday, formatDate, formatVolume, formatWindow } from '@/lib/format';
import { Card, Icon, StatusBadge, Text, colors } from '@/ui';

export interface OrderCardProps {
  order: OrderSummary;
  onPress: () => void;
  /** Larger variant for the home screen's active order. */
  emphasis?: boolean;
}

/** Relative day label for the delivery window ("Bu gün", "Sabah" or the date). */
export function useWindowLabel(): (date: string, start: string, end: string) => string {
  const { t } = useTranslation();
  return (date, start, end) => {
    const offset = dayOffsetFromToday(date);
    const day =
      offset === 0
        ? t('time.today')
        : offset === 1
          ? t('time.tomorrow')
          : offset === -1
            ? t('time.yesterday')
            : formatDate(date);
    return t('time.window', { date: day, window: formatWindow(start, end) });
  };
}

export function OrderCard({ order, onPress, emphasis = false }: OrderCardProps) {
  const { t } = useTranslation();
  const windowLabel = useWindowLabel();
  const inProgress = order.status === 'IN_PROGRESS';
  return (
    <Card onPress={onPress} accessibilityLabel={order.number} compact={!emphasis}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text variant="caption" tone="subtle" weight="medium">
            {order.number}
          </Text>
          <Text variant={emphasis ? 'heading' : 'subheading'} numberOfLines={1}>
            {t('order.summary', {
              grade: order.productGrade,
              volume: formatVolume(order.volumeM3),
              slump: order.slump,
            })}
          </Text>
        </View>
        <StatusBadge kind="order" status={order.status} size={emphasis ? 'md' : 'sm'} />
      </View>
      <View className="mt-3 gap-1.5">
        <View className="flex-row items-center gap-2">
          <Icon name="location-outline" size="sm" color={colors.inkMuted} />
          <Text variant="bodySm" tone="muted" numberOfLines={1} className="flex-1">
            {order.siteName}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Icon name="time-outline" size="sm" color={colors.inkMuted} />
          <Text variant="bodySm" tone="muted" numberOfLines={1} className="flex-1">
            {windowLabel(order.requestedDate, order.timeWindowStart, order.timeWindowEnd)}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-between">
        {inProgress ? (
          <View className="flex-row items-center gap-2">
            <Icon name="navigate" size="sm" color={colors.accentStrong} />
            <Text
              variant="bodySm"
              weight="semibold"
              tone="none"
              className="text-accent-strong dark:text-accent-light"
            >
              {t('delivery.trip', {
                sequence: Math.min(order.deliveriesCompleted + 1, order.deliveriesTotal),
                total: order.deliveriesTotal,
              })}
              {order.activeEtaMinutes !== null
                ? ` · ${t('time.etaMinutes', { minutes: order.activeEtaMinutes })}`
                : ''}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Text variant="bodySm" weight="bold">
          {formatAzn(order.totalAmount)}
        </Text>
      </View>
    </Card>
  );
}
