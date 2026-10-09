import type { DeliveryStatus, OrderEvent } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { formatDateTime } from '@/lib/format';
import { cn } from './cn';
import { deliveryStatusTone, orderStatusTone, type BadgeTone } from './status-badge';
import { Text } from './text';

export interface TimelineProps {
  events: OrderEvent[];
  className?: string;
}

const dotClass: Record<BadgeTone, string> = {
  neutral: 'bg-ink-subtle',
  info: 'bg-info',
  warning: 'bg-warning',
  accent: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
};

/** Audit trail of an order rendered newest-last with coloured dots per status. */
export function Timeline({ events, className }: TimelineProps) {
  const { t } = useTranslation();
  const describe = (
    event: OrderEvent,
  ): { title: string; tone: BadgeTone; reason: string | null } => {
    const reason = typeof event.payload.reason === 'string' ? event.payload.reason : null;
    switch (event.type) {
      case 'CREATED':
        return { title: t('timeline.CREATED'), tone: 'warning', reason };
      case 'STATUS_CHANGED': {
        const status = event.toStatus;
        return {
          title: t('timeline.STATUS_CHANGED', {
            status: status ? t(`status.order.${status}`) : '—',
          }),
          tone: status ? orderStatusTone[status] : 'neutral',
          reason,
        };
      }
      case 'DELIVERY_STATUS_CHANGED': {
        const status = event.payload.status as DeliveryStatus | undefined;
        const sequence = typeof event.payload.sequence === 'number' ? event.payload.sequence : '';
        return {
          title: t('timeline.DELIVERY_STATUS_CHANGED', {
            sequence,
            status: status ? t(`status.delivery.${status}`) : '—',
          }),
          tone: status ? deliveryStatusTone[status] : 'neutral',
          reason,
        };
      }
      case 'PRICE_OVERRIDDEN':
        return { title: t('timeline.PRICE_OVERRIDDEN'), tone: 'info', reason };
      case 'SCHEDULE_CHANGED':
        return { title: t('timeline.SCHEDULE_CHANGED'), tone: 'info', reason };
      case 'NOTE_ADDED':
      default:
        return { title: t('timeline.NOTE_ADDED'), tone: 'neutral', reason };
    }
  };

  return (
    <View className={cn('gap-0', className)}>
      {events.map((event, index) => {
        const { title, tone, reason } = describe(event);
        const last = index === events.length - 1;
        return (
          <View key={event.id} className="flex-row gap-3">
            <View className="items-center">
              <View className={cn('mt-1.5 h-3 w-3 rounded-full', dotClass[tone])} />
              {!last ? <View className="w-0.5 flex-1 bg-border dark:bg-border-dark" /> : null}
            </View>
            <View className={cn('flex-1 gap-0.5', !last && 'pb-4')}>
              <Text weight="medium">{title}</Text>
              {reason ? (
                <Text variant="bodySm" tone="muted">
                  {t('timeline.reason', { reason })}
                </Text>
              ) : null}
              <Text variant="caption" tone="subtle">
                {formatDateTime(event.createdAt)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
