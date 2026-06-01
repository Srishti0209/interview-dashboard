import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Story } from '@/types';

export function useStories(): Story[] | undefined {
  return useLiveQuery(() => db.stories.toArray(), []);
}
