'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { createQueryClient } from '@/api/query-client';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSessionStore } from '@/store/session.store';

/** Client-side providers: API client, server-state cache, tooltips, toasts, session hydration. */
export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // The session store skips automatic hydration so server and client markup match.
    void useSessionStore.persist.rehydrate();
  }, []);

  return (
    <ApiProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </ApiProvider>
  );
}
