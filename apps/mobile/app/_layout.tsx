import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { UserRole } from '@concr/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { createQueryClient } from '@/api/query-client';
import { initI18n } from '@/i18n';
import { selectIsAuthenticated, useSessionStore } from '@/store/session.store';
import { colors, StateView } from '@/ui';

initI18n();

/**
 * Root layout: fonts, providers and role-based routing.
 * Stack.Protected hides route groups whose guard is false and redirects to the first visible
 * one, so a deep link can never land on a screen the user may not see.
 */
export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = useSessionStore((state) => state.hydrated);
  const role = useSessionStore((state) => state.role);
  const isAuthenticated = useSessionStore(selectIsAuthenticated);

  // Without fonts the type scale is wrong; wait briefly, but never block on a font error.
  if (!hydrated || (!fontsLoaded && !fontError)) {
    return <StateView status="loading" />;
  }

  return (
    <ApiProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated && role === UserRole.CUSTOMER}>
            <Stack.Screen name="(customer)" />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated && role === UserRole.DRIVER}>
            <Stack.Screen name="(driver)" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </ApiProvider>
  );
}
