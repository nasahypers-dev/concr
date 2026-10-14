import { useRouter } from 'expo-router';
import { DriverTodayScreen } from '@/features/driver/today-screen';

export default function DriverTodayRoute() {
  const router = useRouter();
  return (
    <DriverTodayScreen
      onOpenTrip={(id) => router.push({ pathname: '/delivery/[id]', params: { id } })}
    />
  );
}
