import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Question, ReviewState } from '@/types';
import type { QuestionFilters } from '@/store/ui';

export function useAllQuestions(): Question[] | undefined {
  return useLiveQuery(() => db.questions.toArray(), []);
}

/** Returns `undefined` while loading, `null` if not found, else the question. */
export function useQuestion(
  id: string | undefined,
): Question | null | undefined {
  return useLiveQuery(
    async () => (id ? ((await db.questions.get(id)) ?? null) : null),
    [id],
  );
}

export function useReviewStates(): Map<string, ReviewState> {
  const states = useLiveQuery(() => db.reviewStates.toArray(), []);
  return useMemo(() => {
    const m = new Map<string, ReviewState>();
    for (const s of states ?? []) m.set(s.questionId, s);
    return m;
  }, [states]);
}

export function useReviewState(
  questionId: string | undefined,
): ReviewState | undefined {
  return useLiveQuery(
    async () =>
      questionId ? await db.reviewStates.get(questionId) : undefined,
    [questionId],
  );
}

/** Distinct sorted tag + company lists for filter UIs. */
export function useFacets(questions: Question[] | undefined) {
  return useMemo(() => {
    const tags = new Set<string>();
    const companies = new Set<string>();
    for (const q of questions ?? []) {
      q.tags?.forEach((t) => tags.add(t));
      q.company?.forEach((c) => companies.add(c));
    }
    return {
      tags: [...tags].sort((a, b) => a.localeCompare(b)),
      companies: [...companies].sort((a, b) => a.localeCompare(b)),
    };
  }, [questions]);
}

export function filterQuestions(
  questions: Question[],
  filters: QuestionFilters,
  reviewStates: Map<string, ReviewState>,
): Question[] {
  const q = filters.search.trim().toLowerCase();
  return questions.filter((item) => {
    if (filters.roundTypes.length && !filters.roundTypes.includes(item.roundType))
      return false;
    if (
      filters.difficulties.length &&
      !filters.difficulties.includes(item.difficulty)
    )
      return false;
    if (filters.sources.length && !filters.sources.includes(item.source))
      return false;
    if (filters.bookmarkedOnly && !item.bookmarked) return false;
    if (
      filters.companies.length &&
      !filters.companies.some((c) => item.company?.includes(c))
    )
      return false;
    if (
      filters.tags.length &&
      !filters.tags.some((t) => item.tags?.includes(t))
    )
      return false;
    if (filters.confidences.length) {
      const conf = reviewStates.get(item.id)?.confidence ?? 0;
      if (!filters.confidences.includes(conf)) return false;
    }
    if (q) {
      const hay = [
        item.title,
        item.body,
        item.personalAnswer ?? '',
        item.personalNotes ?? '',
        ...(item.tags ?? []),
        ...(item.company ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
