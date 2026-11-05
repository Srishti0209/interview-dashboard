import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  QUESTIONS_KEY,
  fetchQuestionData,
  isForRole,
  type QuestionData,
} from '@/lib/questions';
import { useProfile } from '@/hooks/useProfile';
import { ROUND_TYPES } from '@/lib/constants';
import type { Question, ReviewState, RoundType } from '@/types';
import type { QuestionFilters } from '@/store/ui';

function useQuestionData<T>(select: (d: QuestionData) => T) {
  return useQuery({
    queryKey: QUESTIONS_KEY,
    queryFn: fetchQuestionData,
    select,
  }).data;
}

const selectQuestions = (d: QuestionData) => d.questions;
const selectReviews = (d: QuestionData) => d.reviews;

/** The user's question bank: their target role's questions plus their own. */
export function useAllQuestions(): Question[] | undefined {
  const all = useQuestionData(selectQuestions);
  const role = useProfile().data?.targetRoleFamily ?? null;
  return useMemo(() => all?.filter((q) => isForRole(q, role)), [all, role]);
}

/**
 * Returns `undefined` while loading, `null` if not found, else the question.
 * Finds any question the user can see, including other roles' (direct links).
 */
export function useQuestion(
  id: string | undefined,
): Question | null | undefined {
  const questions = useQuestionData(selectQuestions);
  return useMemo(() => {
    if (!questions) return undefined;
    return (id && questions.find((q) => q.id === id)) || null;
  }, [questions, id]);
}

export function useReviewStates(): Map<string, ReviewState> {
  const states = useQuestionData(selectReviews);
  return useMemo(() => {
    const m = new Map<string, ReviewState>();
    for (const s of states ?? []) m.set(s.questionId, s);
    return m;
  }, [states]);
}

export function useReviewState(
  questionId: string | undefined,
): ReviewState | undefined {
  const states = useQuestionData(selectReviews);
  return useMemo(
    () => states?.find((s) => s.questionId === questionId),
    [states, questionId],
  );
}

/**
 * Round types that appear in the user's question bank (i.e. relevant to their
 * target role), in the standard order. `keep` adds rounds that must stay
 * listed, e.g. ones already selected in a filter or form.
 */
export function useRoundTypes(keep: readonly RoundType[] = []): RoundType[] {
  const questions = useAllQuestions();
  const keepKey = keep.join(',');
  return useMemo(() => {
    const present = new Set<RoundType>(questions?.map((q) => q.roundType));
    for (const r of keepKey ? (keepKey.split(',') as RoundType[]) : []) present.add(r);
    return ROUND_TYPES.filter((r) => present.has(r));
  }, [questions, keepKey]);
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
