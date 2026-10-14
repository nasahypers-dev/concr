import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TripCard } from '@/features/driver/trip-card';
import { useDriverDelivery } from '@/features/driver/use-driver';
import { AppHeader, Screen, Skeleton, StateView, Text } from '@/ui';

/**
 * Trip screen placeholder: header and facts only. The big status buttons, concrete timer,
 * navigation and completion with photos arrive in the next step (U2 step 3).
 */
export default function DriverTripScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useDriverDelivery(id);
  const data = trip.data;

  return (
    <Screen>
      <AppHeader
        title={
          data
            ? t('delivery.trip', { sequence: data.sequence, total: data.order.deliveriesTotal })
            : '…'
        }
        subtitle={data?.order.number}
        onBack={() => router.back()}
      />
      {trip.isPending ? (
        <Skeleton className="h-40 w-full" rounded="xl" />
      ) : trip.isError || !data ? (
        <StateView status="error" onRetry={() => void trip.refetch()} />
      ) : (
        <>
          <TripCard trip={data} now={new Date()} />
          <Text variant="bodySm" tone="muted" className="text-center">
            {t('customer.comingSoon')}
          </Text>
        </>
      )}
    </Screen>
  );
}
