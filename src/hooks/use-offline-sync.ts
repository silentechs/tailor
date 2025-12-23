'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/fetch-api';
import { offlineDb } from '@/lib/offline-db';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine || isSyncing) return;

    const unsynced = await offlineDb.getUnsynced();
    if (unsynced.length === 0) return;

    setIsSyncing(true);
    try {
      const response = await fetchApi('/api/measurements/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurements: unsynced }),
      });

      if (!response.ok) throw new Error('Sync failed');

      const result = await response.json();

      // Update local status for successfully synced items
      let syncedCount = 0;
      for (const res of result.results) {
        if (res.status === 'synced') {
          await offlineDb.measurements
            .where('clientSideId')
            .equals(res.clientSideId)
            .modify({ isSynced: true });
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        toast.success(`Automatically synced ${syncedCount} offline measurements`);
      }
    } catch (err) {
      console.error('Offline sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  return { isOnline, isSyncing, sync };
}
