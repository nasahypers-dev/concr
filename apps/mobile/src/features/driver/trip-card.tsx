import { DeliveryStatus, type DriverDelivery } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useWindowLabel } from '@/features/orders/order-card';
import { useOrderSummary } from '@/features/orders/order-summary';
import { formatTime } from '@/lib/format';
import { Card, Icon, type IconName, type IconProps, StatusBadge, Text } from '@/ui';

type HintTone = 'muted' | 'accent' | 'success' | 'danger';

export interface TripHint {
  icon: IconName;
  text: string;
  tone: HintTone;
}

const iconTone: Record<HintTone, IconProps['tone']> = {
  muted: 'muted',
  accent: 'accentStrong',
  success: 'success',
  danger: 'danger',
};

/** Closer than this to the planned departure the card counts down instead of showing the time. */
const DEPARTURE_COUNTDOWN_MINUTES = 120;

/** One line under the facts: what the driver needs to know about this trip right now. */
export function useTripHint(): (trip: DriverDelivery, now: Date) => TripHint | null {
  const { t } = useTranslation();
  return (trip, now) => {
    switch (trip.status) {
      case DeliveryStatus.PLANNED:
      case DeliveryStatus.ASSIGNED:
      case DeliveryStatus.LOADING: {
        if (!trip.plannedDepartureAt) return null;
        const minutes = Math.round((Date.parse(trip.plannedDepartureAt) - now.getTime()) / 60_000);
        if (minutes <= 0) {
          return { icon: 'alert-circle-outline', text: t('driver.departNow'), tone: 'danger' };
        }
        if (minutes <= DEPARTURE_COUNTDOWN_MINUTES) {
          return { icon: 'time-outline', text: t('driver.departIn', { minutes }), tone: 'accent' };
        }
        return {
          icon: 'time-outline',
          text: t('driver.departAt', { time: formatTime(trip.plannedDepartureAt) }),
          tone: 'muted',
        };
      }
      case DeliveryStatus.EN_ROUTE:
        return trip.etaMinutes !== null
          ? {
              icon: 'navigate',
              text: t('delivery.eta', { minutes: trip.etaMinutes }),
              tone: 'accent',
            }
          : { icon: 'navigate', text: t('delivery.noSignal'), tone: 'muted' };
      case DeliveryStatus.ARRIVED:
        return { icon: 'flag-outline', text: t('delivery.arrived'), tone: 'accent' };
      case DeliveryStatus.COMPLETED:
        return trip.completedAt
          ? {
              icon: 'checkmark-circle-outline',
              text: t('driver.completedAt', { time: formatTime(trip.completedAt) }),
              tone: 'success',
            }
          : null;
      case DeliveryStatus.FAILED:
        return trip.failReason
          ? {
              icon: 'alert-circle-outline',
              text: t('timeline.reason', { reason: trip.failReason }),
              tone: 'danger',
            }
          : null;
      default:
        return null;
    }
  };
}

export interface TripCardProps {
  trip: DriverDelivery;
  /** Wall clock, injected so the departure countdown is testable. */
  now: Date;
  onPress?: () => void;
  /** Dimmed variant for the tomorrow preview. */
  muted?: boolean;
}

function FactRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size="sm" tone="muted" />
      <Text variant="bodySm" tone="muted" numberOfLines={1} className="flex-1">
        {text}
      </Text>
    </View>
  );
}

/** One trip in the driver's day: where, what, when, and the one thing to know right now. */
export function TripCard({ trip, now, onPress, muted = false }: TripCardProps) {
  const { t } = useTranslation();
  const windowLabel = useWindowLabel();
  const summary = useOrderSummary();
  const tripHint = useTripHint();
  const hint = tripHint(trip, now);
  const title = t('driver.tripTitle', {
    sequence: trip.sequence,
    total: trip.order.deliveriesTotal,
    number: trip.order.number,
  });
  return (
    <Card
      onPress={onPress}
      compact
      accessibilityLabel={title}
      className={muted ? 'opacity-70' : undefined}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text variant="caption" tone="subtle" weight="medium">
            {title}
          </Text>
          <Text variant="subheading" numberOfLines={1}>
            {trip.site.name}
          </Text>
        </View>
        <StatusBadge kind="delivery" status={trip.status} size="sm" />
      </View>
      <View className="mt-3 gap-1.5">
        <FactRow icon="location-outline" text={trip.site.addressLine} />
        <FactRow
          icon="cube-outline"
          text={summary(trip.order.productGrade, trip.volumeM3, trip.order.slump)}
        />
        <FactRow
          icon="time-outline"
          text={windowLabel(
            trip.order.requestedDate,
            trip.order.timeWindowStart,
            trip.order.timeWindowEnd,
          )}
        />
      </View>
      {hint ? (
        <View className="mt-3 flex-row items-center gap-2">
          <Icon name={hint.icon} size="sm" tone={iconTone[hint.tone]} />
          <Text variant="bodySm" weight="semibold" tone={hint.tone}>
            {hint.text}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
