import type { DeliveryStatus, OrderStatus } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'accent' | 'success' | 'danger';

export const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SCHEDULED: 'info',
  IN_PROGRESS: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
};

export const deliveryStatusTone: Record<DeliveryStatus, BadgeTone> = {
  PLANNED: 'neutral',
  ASSIGNED: 'info',
  LOADING: 'warning',
  EN_ROUTE: 'accent',
  ARRIVED: 'info',
  UNLOADING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  FAILED: 'danger',
};

const toneClass: Record<BadgeTone, { box: string; text: string }> = {
  neutral: { box: 'bg-surface-muted', text: 'text-ink-muted' },
  info: { box: 'bg-info-soft', text: 'text-info' },
  warning: { box: 'bg-warning-soft', text: 'text-warning' },
  accent: { box: 'bg-accent-soft', text: 'text-accent-strong' },
  success: { box: 'bg-success-soft', text: 'text-success' },
  danger: { box: 'bg-danger-soft', text: 'text-danger' },
};

export type StatusBadgeProps =
  | { kind: 'order'; status: OrderStatus; className?: string; size?: 'sm' | 'md' }
  | { kind: 'delivery'; status: DeliveryStatus; className?: string; size?: 'sm' | 'md' };

/** Translated, colour-coded status pill for orders and deliveries. */
export function StatusBadge(props: StatusBadgeProps) {
  const { t } = useTranslation();
  const tone =
    props.kind === 'order' ? orderStatusTone[props.status] : deliveryStatusTone[props.status];
  const label =
    props.kind === 'order'
      ? t(`status.order.${props.status}`)
      : t(`status.delivery.${props.status}`);
  const size = props.size ?? 'md';
  return (
    <View
      accessibilityRole="text"
      className={cn(
        'self-start rounded-full',
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1',
        toneClass[tone].box,
        props.className,
      )}
    >
      <Text
        variant={size === 'sm' ? 'caption' : 'bodySm'}
        weight="semibold"
        className={toneClass[tone].text}
      >
        {label}
      </Text>
    </View>
  );
}
