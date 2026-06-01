import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { MockSession } from '@/types';

export function useMockSessions(): MockSession[] | undefined {
  return useLiveQuery(
    () => db.mockSessions.orderBy('startedAt').reverse().toArray(),
    [],
  );
}
