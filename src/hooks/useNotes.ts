import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NOTES_KEY, fetchNotes } from '@/lib/notes';
import type { Note } from '@/types';

/** All notes, most recently edited first. */
export function useAllNotes(): Note[] | undefined {
  return useQuery({ queryKey: NOTES_KEY, queryFn: fetchNotes }).data;
}

/** `undefined` while loading, `null` if not found, else the note. */
export function useNote(id: string | undefined): Note | null | undefined {
  const notes = useAllNotes();
  return useMemo(() => {
    if (!notes) return undefined;
    return (id && notes.find((n) => n.id === id)) || null;
  }, [notes, id]);
}

export function useLinkedNotes(questionId: string | undefined): Note[] {
  const notes = useAllNotes();
  return useMemo(
    () =>
      questionId && notes
        ? notes.filter((n) => n.linkedQuestionIds.includes(questionId))
        : [],
    [notes, questionId],
  );
}
