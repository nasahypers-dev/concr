import type { DeliveryStatus, OrderStatus } from '@concr/shared';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'accent' | 'success' | 'danger';

/** Same tone map as the mobile app (apps/mobile/src/ui/status-badge.tsx). */
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

export const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-800',
  accent: 'bg-concr-accent/20 text-amber-900',
  success: 'bg-green-50 text-green-700',
  danger: 'bg-red-50 text-red-700',
};

/** Solid colours for map markers and board blocks. */
export const deliveryStatusColor: Record<DeliveryStatus, string> = {
  PLANNED: '#9CA3AF',
  ASSIGNED: '#2563EB',
  LOADING: '#B45309',
  EN_ROUTE: '#F5A623',
  ARRIVED: '#0E7490',
  UNLOADING: '#92400E',
  COMPLETED: '#15803D',
  CANCELLED: '#6B7280',
  FAILED: '#DC2626',
};

export type StatusBadgeProps = (
  { kind: 'order'; status: OrderStatus } | { kind: 'delivery'; status: DeliveryStatus }
) & { className?: string };

/** Translated, colour-coded status pill for orders and deliveries. */
export function StatusBadge(props: StatusBadgeProps) {
  const t = useTranslations('status');
  const tone =
    props.kind === 'order' ? orderStatusTone[props.status] : deliveryStatusTone[props.status];
  const label = props.kind === 'order' ? t(`order.${props.status}`) : t(`delivery.${props.status}`);
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap',
        toneClass[tone],
        props.className,
      )}
    >
      {label}
    </span>
  );
}
