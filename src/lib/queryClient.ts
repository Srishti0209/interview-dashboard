import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { del, get, set } from 'idb-keyval';

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

/** Key of the persisted cache entry in IndexedDB (idb-keyval's store). */
export const CACHE_KEY = 'interview-prep-cache';

/**
 * Persists the query cache (and queued offline edits) to IndexedDB so the app
 * can boot offline with the signed-in user's data. Cleared on sign-out.
 */
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key).then((v) => v ?? null),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: CACHE_KEY,
  // Save soon after data arrives so a quick reload offline still has it.
  throttleTime: 100,
});

export const PERSIST_MAX_AGE = WEEK;
