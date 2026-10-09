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

/** Light: dark text on a soft tint. Dark: light text on a deep tint (never white on amber). */
const toneClass: Record<BadgeTone, { box: string; text: string }> = {
  neutral: {
    box: 'bg-surface-muted dark:bg-surface-muted-dark',
    text: 'text-ink-muted dark:text-ink-muted-dark',
  },
  info: { box: 'bg-info-soft dark:bg-info-soft-dark', text: 'text-info dark:text-info-light' },
  warning: {
    box: 'bg-warning-soft dark:bg-warning-soft-dark',
    text: 'text-warning dark:text-warning-light',
  },
  accent: {
    box: 'bg-accent-soft dark:bg-accent-soft-dark',
    text: 'text-accent-strong dark:text-accent-light',
  },
  success: {
    box: 'bg-success-soft dark:bg-success-soft-dark',
    text: 'text-success dark:text-success-light',
  },
  danger: {
    box: 'bg-danger-soft dark:bg-danger-soft-dark',
    text: 'text-danger dark:text-danger-light',
  },
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
        tone="none"
        className={toneClass[tone].text}
      >
        {label}
      </Text>
    </View>
  );
}
