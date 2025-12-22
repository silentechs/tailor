import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { offlineDb } from '@/lib/offline-db';

export function useMeasurementDraft(clientId: string | undefined, control: any) {
  const values = useWatch({ control, name: 'measurements' });

  useEffect(() => {
    if (typeof window === 'undefined' || !clientId || !values || Object.keys(values).length === 0)
      return;

    let isMounted = true;

    const saveDraft = async () => {
      try {
        // Check if we already have a draft for this client that isn't synced
        const existing = await offlineDb.getDraftForClient(clientId);

        if (existing) {
          if (!isMounted) return;
          await offlineDb.measurements.update(existing.id!, {
            values,
            updatedAt: Date.now(),
          });
        } else {
          if (!isMounted) return;
          await offlineDb.measurements.add({
            clientSideId: uuidv4(),
            clientId,
            values,
            isSynced: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } catch (err) {
        console.error('Failed to save measurement draft:', err);
      }
    };

    const timeout = setTimeout(saveDraft, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [clientId, values]);
}
