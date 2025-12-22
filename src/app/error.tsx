'use client';

import { RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { captureError } from '@/lib/logger';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    captureError('AppError', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <Button onClick={reset} size="lg" className="min-w-[150px]">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
