'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AnalyticsProvider } from '@/hooks/use-analytics';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}
