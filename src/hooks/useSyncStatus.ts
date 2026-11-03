import { useSyncExternalStore } from 'react';
import { onlineManager, useIsMutating } from '@tanstack/react-query';
import { SYNC_KEY, syncError } from '@/lib/sync';

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  );
}

/** Queued writes, connectivity and the last sync error. */
export function useSyncStatus() {
  const pending = useIsMutating({ mutationKey: SYNC_KEY });
  const online = useOnline();
  const error = useSyncExternalStore(syncError.subscribe, syncError.get);
  return { pending, online, error };
}
