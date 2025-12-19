'use client';

import { ClipboardList, RefreshCw, Scissors, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);

    if (navigator.onLine) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/dashboard/business';
      }
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard/business';
  };

  const handleGoToOrders = () => {
    window.location.href = '/dashboard/orders';
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {isOnline ? (
              <Wifi className="w-8 h-8 text-green-600" />
            ) : (
              <WifiOff className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-primary">
            {isOnline ? 'Back in Business!' : 'Workshop is Offline'}
          </CardTitle>
          <CardDescription className="text-base">
            {isOnline
              ? 'Your connection is back. You can continue managing your craft.'
              : "The internet seems to be down. Don't worry, you can still access cached data."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isOnline ? (
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full bg-primary hover:bg-primary/90">
                <RefreshCw className="w-4 h-4 mr-2" />
                Resume Working
              </Button>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleGoToOrders} className="w-full" variant="default">
                <ClipboardList className="w-4 h-4 mr-2" />
                View Cached Orders
              </Button>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                Business Overview
              </Button>
              <Button
                onClick={handleRetry}
                variant="ghost"
                className="w-full text-muted-foreground"
                disabled={retryCount > 3}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                {retryCount > 3 ? 'Check your settings' : 'Try Reconnecting'}
              </Button>
            </div>
          )}

          <div className="bg-muted/50 p-4 rounded-lg border border-dashed mt-6">
            <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Tailor's Offline Mode:
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>View client measurements and contact info</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Access order status and deadlines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Draft new style notes locally</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
