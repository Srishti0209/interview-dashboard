import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Must outlive the persisted cache so restored data isn't dropped.
      gcTime: WEEK,
      refetchOnWindowFocus: false,
      // Serve cached data offline instead of waiting for the network.
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Persists the query cache to localStorage so the app can boot offline with
 * the signed-in user's profile and data. Cleared on sign-out (AuthGate).
 */
export const queryPersister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: 'interview-prep-cache',
  // Save soon after data arrives so a quick reload offline still has it.
  throttleTime: 100,
});

export const PERSIST_MAX_AGE = WEEK;
