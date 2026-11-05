import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { supabase } from '@/lib/supabase';
import { QUESTIONS_KEY } from '@/lib/questions';
import type { Difficulty, RoleFamily, RoleLevel, RoundType } from '@/types';

// ---------------------------------------------------------------------------
// Admin panel: the shared question bank (owner_id null), drafts included.
// Writes go straight to Supabase (not the offline queue): an admin edits
// online and should see a failure immediately. RLS allows them only for
// admins (migration 0005). Every admin change or delete is versioned by a
// database trigger (migration 0006, content_versions).
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
  /** Set when the question is in the bin (hidden from users). */
  deletedAt: number | null;
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
  deleted_at: number | null;
  updated_at: number;
  body?: string;
  answer?: string | null;
}

const SUMMARY_COLUMNS =
  'id, title, round_type, difficulty, role_families, levels, company, tags, review_status, admin_edited, deleted_at, updated_at';

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
    deletedAt: r.deleted_at === null ? null : Number(r.deleted_at),
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

export type AdminQuestionInput = Omit<AdminQuestion, 'id' | 'adminEdited' | 'deletedAt' | 'updatedAt'>;

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
    await updateShared(id, row);
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

async function updateShared(id: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('questions')
    .update(patch)
    .eq('id', id)
    .is('owner_id', null)
    .select('id');
  if (error) throw error;
  if (!data.length) throw notAllowed();
}

/** Hides a question from users. Their answers and notes on it are kept. */
export async function moveToBin(id: string): Promise<void> {
  const now = Date.now();
  await updateShared(id, { deleted_at: now, admin_edited: true, updated_at: now });
  await refreshAfterChange();
}

export async function restoreFromBin(id: string): Promise<void> {
  await updateShared(id, { deleted_at: null, updated_at: Date.now() });
  await refreshAfterChange();
}

/** Deletes a binned question for good, and with it every user's answer and notes on it. */
export async function deleteForever(id: string): Promise<void> {
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

// ---------------------------------------------------------------------------
// Edit history
// ---------------------------------------------------------------------------
export interface QuestionVersion {
  id: number;
  createdAt: string;
  changedBy: string | null;
  question: AdminQuestion;
}

export interface RawVersion<T> {
  id: number;
  created_at: string;
  changed_by: string | null;
  snapshot: T;
}

/** Previous versions of any shared content, newest first. */
export async function fetchVersions<T>(
  entity: 'question' | 'company' | 'playbook',
  entityId: string,
): Promise<RawVersion<T>[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select('id, created_at, changed_by, snapshot')
    .eq('entity', entity)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as RawVersion<T>[];
}

/** Previous versions, newest first (each is the question before a change). */
export async function fetchQuestionVersions(id: string): Promise<QuestionVersion[]> {
  const data = await fetchVersions<Row>('question', id);
  return data.map((v) => ({
    id: v.id,
    createdAt: v.created_at,
    changedBy: v.changed_by,
    question: fromRow(v.snapshot),
  }));
}

/** Puts an old version's content back (the current one is versioned first). */
export async function restoreVersion(id: string, version: AdminQuestion): Promise<void> {
  await saveSharedQuestion(
    {
      title: version.title,
      body: version.body,
      answer: version.answer,
      roundType: version.roundType,
      difficulty: version.difficulty,
      roleFamilies: version.roleFamilies,
      levels: version.levels,
      company: version.company,
      tags: version.tags,
      status: version.status,
    },
    id,
  );
}

// RLS hides rows a user may not change, so a blocked write affects 0 rows.
const notAllowed = () =>
  new Error('Not saved: your account can’t edit shared questions, or the question no longer exists.');

// The admin's own Question Bank reflects the change straight away.
async function refreshAfterChange() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ADMIN_QUESTIONS_KEY }),
    queryClient.invalidateQueries({ queryKey: ['admin-question'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-question-versions'] }),
    queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  ]);
}
