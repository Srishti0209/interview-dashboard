import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { QUESTIONS_KEY, fetchQuestionData } from '@/lib/questions';
import { NOTES_KEY, fetchNotes } from '@/lib/notes';
import { STORIES_KEY, fetchStories } from '@/lib/stories';
import { COMPANIES_KEY, fetchCompanyData, mergeCompanies } from '@/lib/companies';
import { MOCK_SESSIONS_KEY, fetchMockSessions } from '@/lib/mock';
import { JOBS_KEY, fetchJobs } from '@/lib/jobs';
import { syncStudyDays } from '@/lib/streak';
import { waitForPendingWrites } from '@/lib/sync';
import type {
  Company,
  JobDescription,
  MockSession,
  Note,
  Question,
  ReviewState,
  Story,
} from '@/types';

/** Device preferences included in backups (account data lives in tables). */
const LS_KEYS = ['studyLog', 'interview-prep-ui', 'mockSessionCount'];

/** Same file format as the local-first version, so old backups still import. */
export interface BackupFile {
  app: 'interview-prep-pwa';
  version: number;
  exportedAt: number;
  tables: {
    questions: unknown[];
    reviewStates: unknown[];
    notes: unknown[];
    stories: unknown[];
    companies: unknown[];
    mockSessions: unknown[];
    /** Jobs and their gap analyses; absent in backups made before Phase 6. */
    jobs?: unknown[];
  };
  localStorage: Record<string, string>;
}

export async function exportAll(): Promise<BackupFile> {
  await waitForPendingWrites();
  const [questionData, notes, stories, companyData, mockSessions, jobs] =
    await Promise.all([
      queryClient.fetchQuery({ queryKey: QUESTIONS_KEY, queryFn: fetchQuestionData }),
      queryClient.fetchQuery({ queryKey: NOTES_KEY, queryFn: fetchNotes }),
      queryClient.fetchQuery({ queryKey: STORIES_KEY, queryFn: fetchStories }),
      queryClient.fetchQuery({ queryKey: COMPANIES_KEY, queryFn: fetchCompanyData }),
      queryClient.fetchQuery({ queryKey: MOCK_SESSIONS_KEY, queryFn: fetchMockSessions }),
      queryClient.fetchQuery({ queryKey: JOBS_KEY, queryFn: fetchJobs }),
    ]);

  const localStorageDump: Record<string, string> = {};
  for (const k of LS_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) localStorageDump[k] = v;
  }

  return {
    app: 'interview-prep-pwa',
    version: 1,
    exportedAt: Date.now(),
    tables: {
      questions: questionData.questions,
      reviewStates: questionData.reviews,
      notes,
      stories,
      companies: mergeCompanies(companyData, null),
      mockSessions,
      jobs,
    },
    localStorage: localStorageDump,
  };
}

export function downloadBackup(data: BackupFile): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-prep-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function check<T>(p: PromiseLike<{ error: { message: string } | null; data?: T }>) {
  const { error, data } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

async function upsertChunks(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  ignoreDuplicates = false,
) {
  for (let i = 0; i < rows.length; i += 200) {
    await check(
      supabase
        .from(table)
        .upsert(rows.slice(i, i + 200), { onConflict, ignoreDuplicates }),
    );
  }
}

export interface ImportSummary {
  answers: number;
  reviews: number;
  notes: number;
  stories: number;
  applications: number;
  mockSessions: number;
  ownQuestions: number;
  jobs: number;
}

/**
 * Writes a backup's user-owned data into the signed-in account. Shared
 * content (the question bank and company info) is never overwritten.
 *
 * - `replace`: the account's own data is cleared first, so it ends up
 *   matching the backup exactly (the Settings → Import behaviour).
 * - `merge`: rows are added or updated by id; nothing is deleted
 *   (used for the one-time import of data saved in this browser).
 */
export async function importAll(
  data: BackupFile,
  mode: 'replace' | 'merge' = 'replace',
): Promise<ImportSummary> {
  if (data.app !== 'interview-prep-pwa' || !data.tables) {
    throw new Error('Not a valid Interview Prep backup file.');
  }
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Please sign in again.');
  await waitForPendingWrites();

  const questions = (data.tables.questions ?? []) as Question[];
  const reviews = (data.tables.reviewStates ?? []) as ReviewState[];
  const notes = (data.tables.notes ?? []) as Note[];
  const stories = (data.tables.stories ?? []) as Story[];
  const companies = (data.tables.companies ?? []) as Company[];
  const mockSessions = (data.tables.mockSessions ?? []) as MockSession[];
  const jobs = (data.tables.jobs ?? []) as JobDescription[];

  if (mode === 'replace') {
    for (const table of [
      'user_question_state',
      'user_company_state',
      'notes',
      'stories',
      'mock_sessions',
      'study_days',
      'job_descriptions',
    ]) {
      await check(supabase.from(table).delete().eq('user_id', userId));
    }
    await check(supabase.from('questions').delete().eq('owner_id', userId));
  }

  // The user's own questions.
  const own = questions.filter((q) => q.source !== 'seed');
  await upsertChunks(
    'questions',
    own.map((q) => ({
      id: q.id,
      round_type: q.roundType,
      title: q.title,
      body: q.body ?? '',
      answer: q.answer ?? null,
      difficulty: q.difficulty,
      company: q.company ?? [],
      tags: q.tags ?? [],
      source: q.source,
      created_at: q.createdAt ?? Date.now(),
      updated_at: q.updatedAt ?? Date.now(),
    })),
    'id',
  );

  // Personal fields + review state, only for questions that exist in the
  // account's bank (skips anything from an older, different seed).
  const known = new Set(
    (await fetchQuestionData()).questions.map((q) => q.id),
  );
  const state = new Map<string, Record<string, unknown>>();
  const row = (id: string) => {
    if (!state.has(id)) state.set(id, { question_id: id, updated_at: Date.now() });
    return state.get(id)!;
  };
  let answers = 0;
  for (const q of questions) {
    if (!known.has(q.id)) continue;
    if (q.personalAnswer || q.personalNotes || q.bookmarked) {
      if (q.personalAnswer?.trim()) answers++;
      Object.assign(row(q.id), {
        personal_answer: q.personalAnswer ?? null,
        personal_notes: q.personalNotes ?? null,
        bookmarked: Boolean(q.bookmarked),
      });
    }
  }
  const validReviews = reviews.filter((r) => known.has(r.questionId));
  for (const r of validReviews) {
    Object.assign(row(r.questionId), {
      confidence: r.confidence,
      last_reviewed: r.lastReviewed ?? null,
      next_due: r.nextDue,
      interval_days: r.intervalDays,
      ease_factor: r.easeFactor,
      review_count: r.reviewCount,
    });
  }
  // Rows must share the same columns in one upsert batch, so write
  // personal-field rows and review rows in separate passes.
  const personalRows = [...state.values()].filter((r) => 'personal_answer' in r);
  const reviewOnly = [...state.values()].filter((r) => !('personal_answer' in r));
  await upsertChunks('user_question_state', personalRows.filter((r) => !('next_due' in r)), 'user_id,question_id');
  await upsertChunks('user_question_state', personalRows.filter((r) => 'next_due' in r), 'user_id,question_id');
  await upsertChunks('user_question_state', reviewOnly, 'user_id,question_id');

  await upsertChunks(
    'notes',
    notes.map((n) => ({
      id: n.id,
      title: n.title ?? '',
      body_json: n.bodyJson ?? {},
      tags: n.tags ?? [],
      linked_question_ids: n.linkedQuestionIds ?? [],
      created_at: n.createdAt ?? Date.now(),
      updated_at: n.updatedAt ?? Date.now(),
    })),
    'id',
  );

  const now = Date.now();
  await upsertChunks(
    'stories',
    stories.map((s, i) => ({
      id: s.id,
      title: s.title ?? '',
      situation: s.situation ?? '',
      task: s.task ?? '',
      action: s.action ?? '',
      result: s.result ?? '',
      metrics: s.metrics ?? '',
      applicable_to: s.applicableTo ?? [],
      tags: s.tags ?? [],
      source: s.source ?? 'user',
      is_draft: s.isDraft ?? false,
      details: s.details ?? {},
      // keep the backup's order
      created_at: now + i,
      updated_at: now,
    })),
    'id',
  );

  const companyIds = new Set(
    (await fetchCompanyData()).companies.map((c) => c.id),
  );
  const applications = companies.filter(
    (c) =>
      companyIds.has(c.id) &&
      (c.applicationStatus || c.applicationNotes || c.applicationDates?.length),
  );
  await upsertChunks(
    'user_company_state',
    applications.map((c) => ({
      company_id: c.id,
      application_status: c.applicationStatus ?? null,
      application_notes: c.applicationNotes ?? null,
      application_dates: c.applicationDates ?? [],
    })),
    'user_id,company_id',
  );

  await upsertChunks(
    'mock_sessions',
    mockSessions.map((m) => ({
      id: m.id,
      started_at: m.startedAt,
      ended_at: m.endedAt ?? null,
      round_types: m.roundTypes ?? [],
      company_id: m.companyId && companyIds.has(m.companyId) ? m.companyId : null,
      self_rating: m.selfRating ?? null,
      notes: m.notes ?? null,
    })),
    'id',
  );

  // Jobs keep their ids, so links in their gap analyses to the stories and
  // own questions restored above still work.
  await upsertChunks(
    'job_descriptions',
    jobs.map((j) => ({
      id: j.id,
      company: j.company ?? '',
      title: j.title ?? '',
      raw_text: j.rawText ?? '',
      company_values: j.companyValues ?? '',
      file_name: j.fileName ?? null,
      interview_date: j.interviewDate ?? null,
      parsed: j.parsed ?? null,
      gaps: j.gaps ?? null,
      created_at: j.createdAt ?? new Date().toISOString(),
    })),
    'id',
  );

  // Device preferences + study days.
  for (const [k, v] of Object.entries(data.localStorage ?? {})) {
    if (LS_KEYS.includes(k)) localStorage.setItem(k, v);
  }
  let days: string[];
  try {
    days = JSON.parse(data.localStorage?.studyLog ?? '[]');
  } catch {
    days = [];
  }
  await upsertChunks(
    'study_days',
    days.map((day) => ({ day })),
    'user_id,day',
    true,
  );
  await syncStudyDays();

  await queryClient.invalidateQueries();
  return {
    answers,
    reviews: validReviews.length,
    notes: notes.length,
    stories: stories.length,
    applications: applications.length,
    mockSessions: mockSessions.length,
    ownQuestions: own.length,
    jobs: jobs.length,
  };
}

/**
 * Reloads the shared question bank and company playbooks from the server.
 * The user's own data is never affected.
 */
export async function resetToSeed(): Promise<void> {
  await queryClient.invalidateQueries();
}
