import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// "Report a problem" on shared questions, and the admin feedback inbox.
// Anyone signed in can report; only admins can read and resolve (RLS,
// migration 0006).
// ---------------------------------------------------------------------------
export const FEEDBACK_KEY = ['admin-feedback'] as const;
export const OPEN_FEEDBACK_KEY = ['admin-feedback-open-count'] as const;

export type FeedbackKind = 'wrong_answer' | 'typo' | 'unclear' | 'outdated' | 'other';

export const FEEDBACK_KINDS: [FeedbackKind, string][] = [
  ['wrong_answer', 'Answer is wrong'],
  ['typo', 'Typo or formatting'],
  ['unclear', 'Unclear'],
  ['outdated', 'Out of date'],
  ['other', 'Something else'],
];
export const FEEDBACK_KIND_LABEL = Object.fromEntries(FEEDBACK_KINDS) as Record<FeedbackKind, string>;

export async function submitFeedback(questionId: string, kind: FeedbackKind, message: string): Promise<void> {
  const { error } = await supabase
    .from('question_feedback')
    .insert({ question_id: questionId, kind, message: message.trim() });
  if (error) throw error;
}

export interface FeedbackItem {
  id: string;
  questionId: string;
  questionTitle: string;
  kind: FeedbackKind;
  message: string;
  userId: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface FeedbackRow {
  id: string;
  question_id: string;
  kind: FeedbackKind;
  message: string;
  user_id: string;
  created_at: string;
  resolved_at: string | null;
  question: { title: string } | null;
}

/** Newest first. Admins only. */
export async function fetchFeedback(): Promise<FeedbackItem[]> {
  const { data, error } = await supabase
    .from('question_feedback')
    .select('id, question_id, kind, message, user_id, created_at, resolved_at, question:questions(title)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as unknown as FeedbackRow[]).map((r) => ({
    id: r.id,
    questionId: r.question_id,
    questionTitle: r.question?.title ?? '(question no longer exists)',
    kind: r.kind,
    message: r.message,
    userId: r.user_id,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  }));
}

export async function fetchOpenFeedbackCount(): Promise<number> {
  const { count, error } = await supabase
    .from('question_feedback')
    .select('id', { count: 'exact', head: true })
    .is('resolved_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function setFeedbackResolved(id: string, resolved: boolean, by: string | undefined): Promise<void> {
  const { data, error } = await supabase
    .from('question_feedback')
    .update(resolved ? { resolved_at: new Date().toISOString(), resolved_by: by } : { resolved_at: null, resolved_by: null })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data.length) throw new Error('Not saved: only admins can resolve feedback.');
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: FEEDBACK_KEY }),
    queryClient.invalidateQueries({ queryKey: OPEN_FEEDBACK_KEY }),
  ]);
}
