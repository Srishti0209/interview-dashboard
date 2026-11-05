import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { supabase } from '@/lib/supabase';
import { QUESTIONS_KEY } from '@/lib/questions';
import type { Difficulty, RoleFamily, RoleLevel, RoundType } from '@/types';

// ---------------------------------------------------------------------------
// Admin panel: the shared question bank (owner_id null), drafts included.
// Writes go straight to Supabase (not the offline queue): an admin edits
// online and should see a failure immediately. RLS allows them only for
// admins (migration 0005).
// ---------------------------------------------------------------------------
export const ADMIN_QUESTIONS_KEY = ['admin-questions'] as const;

export type ReviewStatus = 'draft' | 'approved';

/** List view: everything except the long prompt and answer. */
export interface AdminQuestionSummary {
  id: string;
  title: string;
  roundType: RoundType;
  difficulty: Difficulty;
  roleFamilies: RoleFamily[];
  levels: RoleLevel[];
  company: string[];
  tags: string[];
  status: ReviewStatus;
  adminEdited: boolean;
  updatedAt: number;
}

export interface AdminQuestion extends AdminQuestionSummary {
  body: string;
  answer: string;
}

interface Row {
  id: string;
  title: string;
  round_type: RoundType;
  difficulty: Difficulty;
  role_families: RoleFamily[];
  levels: RoleLevel[];
  company: string[];
  tags: string[];
  review_status: string;
  admin_edited: boolean;
  updated_at: number;
  body?: string;
  answer?: string | null;
}

const SUMMARY_COLUMNS =
  'id, title, round_type, difficulty, role_families, levels, company, tags, review_status, admin_edited, updated_at';

function fromRow(r: Row): AdminQuestion {
  return {
    id: r.id,
    title: r.title,
    roundType: r.round_type,
    difficulty: r.difficulty,
    roleFamilies: r.role_families ?? [],
    levels: r.levels ?? [],
    company: r.company ?? [],
    tags: r.tags ?? [],
    status: r.review_status === 'approved' ? 'approved' : 'draft',
    adminEdited: r.admin_edited,
    updatedAt: Number(r.updated_at),
    body: r.body ?? '',
    answer: r.answer ?? '',
  };
}

export async function fetchSharedQuestions(): Promise<AdminQuestionSummary[]> {
  const rows = await fetchAll<Row>('questions', SUMMARY_COLUMNS, 'title', { isNull: 'owner_id' });
  return rows.map(fromRow);
}

export async function fetchSharedQuestion(id: string): Promise<AdminQuestion | null> {
  const { data, error } = await supabase
    .from('questions')
    .select(`${SUMMARY_COLUMNS}, body, answer`)
    .eq('id', id)
    .is('owner_id', null)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : null;
}

export type AdminQuestionInput = Omit<AdminQuestion, 'id' | 'adminEdited' | 'updatedAt'>;

/** Creates (no id) or updates a shared question. Returns its id. */
export async function saveSharedQuestion(input: AdminQuestionInput, id?: string): Promise<string> {
  const now = Date.now();
  const row = {
    title: input.title.trim(),
    body: input.body,
    answer: input.answer.trim() ? input.answer : null,
    round_type: input.roundType,
    difficulty: input.difficulty,
    role_families: input.roleFamilies,
    levels: input.levels,
    company: input.company,
    tags: input.tags,
    review_status: input.status,
    admin_edited: true,
    updated_at: now,
  };
  if (id) {
    const { data, error } = await supabase
      .from('questions')
      .update(row)
      .eq('id', id)
      .is('owner_id', null)
      .select('id');
    if (error) throw error;
    if (!data.length) throw notAllowed();
  } else {
    id = crypto.randomUUID();
    const { error } = await supabase
      .from('questions')
      .insert({ ...row, id, owner_id: null, source: 'seed', created_at: now });
    if (error) throw error;
  }
  await refreshAfterChange();
  return id;
}

/** Deletes a shared question, and with it every user's answer and notes on it. */
export async function deleteSharedQuestion(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)
    .is('owner_id', null)
    .select('id');
  if (error) throw error;
  if (!data.length) throw notAllowed();
  await refreshAfterChange();
}

// RLS hides rows a user may not change, so a blocked write affects 0 rows.
const notAllowed = () =>
  new Error('Not saved: your account can’t edit shared questions, or the question no longer exists.');

// The admin's own Question Bank reflects the change straight away.
async function refreshAfterChange() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ADMIN_QUESTIONS_KEY }),
    queryClient.invalidateQueries({ queryKey: ['admin-question'] }),
    queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  ]);
}
