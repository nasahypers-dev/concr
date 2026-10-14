import { useLocalSearchParams, useRouter } from 'expo-router';
import { TripScreen } from '@/features/driver/trip-screen';

export default function DriverTripRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TripScreen id={id} onBack={() => router.back()} onDone={() => router.navigate('/')} />;
}
