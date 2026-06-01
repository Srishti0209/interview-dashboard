import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Note } from '@/types';

export function useAllNotes(): Note[] | undefined {
  return useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().toArray(),
    [],
  );
}

/** `undefined` while loading, `null` if not found, else the note. */
export function useNote(id: string | undefined): Note | null | undefined {
  return useLiveQuery(
    async () => (id ? ((await db.notes.get(id)) ?? null) : null),
    [id],
  );
}

export function useLinkedNotes(questionId: string | undefined): Note[] {
  return (
    useLiveQuery(
      async () =>
        questionId
          ? await db.notes
              .where('linkedQuestionIds')
              .equals(questionId)
              .toArray()
          : [],
      [questionId],
    ) ?? []
  );
}
