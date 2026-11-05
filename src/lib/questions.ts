import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { enqueue, waitForPendingWrites } from '@/lib/sync';
import { uid } from '@/lib/utils';
import type {
  Question,
  RoundType,
  Difficulty,
  ReviewState,
  Confidence,
  Source,
  RoleFamily,
} from '@/types';

// ---------------------------------------------------------------------------
// Cache shape: the question bank (shared + the user's own) merged with the
// user's personal fields, plus SM-2 review states. Both live in one query
// because they come from the same per-user table.
// ---------------------------------------------------------------------------
export const QUESTIONS_KEY = ['questions'] as const;

export interface QuestionData {
  questions: Question[];
  reviews: ReviewState[];
  /** updated_at of each user_question_state row, for conflict detection. */
  stateUpdatedAt: Record<string, number>;
}

interface QuestionRow {
  id: string;
  round_type: RoundType;
  title: string;
  body: string;
  answer: string | null;
  difficulty: Difficulty;
  company: string[];
  tags: string[];
  source: Source;
  role_families: RoleFamily[];
  review_status: 'draft' | 'approved' | 'rejected';
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
}

interface StateRow {
  question_id: string;
  personal_answer: string | null;
  personal_notes: string | null;
  bookmarked: boolean;
  confidence: number;
  last_reviewed: number | null;
  next_due: number | null;
  interval_days: number;
  ease_factor: number;
  review_count: number;
  updated_at: number;
}

const QUESTION_COLUMNS =
  'id, round_type, title, body, answer, difficulty, company, tags, source, role_families, review_status, deleted_at, created_at, updated_at';
const STATE_COLUMNS =
  'question_id, personal_answer, personal_notes, bookmarked, confidence, last_reviewed, next_due, interval_days, ease_factor, review_count, updated_at';

/**
 * Whether a question belongs in the user's bank: shared questions for their
 * target role, plus every question they created themselves.
 */
export function isForRole(q: Question, role: RoleFamily | null): boolean {
  if (q.source !== 'seed' || !role || !q.roleFamilies?.length) return true;
  return q.roleFamilies.includes(role);
}

export async function fetchQuestionData(): Promise<QuestionData> {
  await waitForPendingWrites();
  const [rows, states] = await Promise.all([
    fetchAll<QuestionRow>('questions', QUESTION_COLUMNS, 'id'),
    fetchAll<StateRow>('user_question_state', STATE_COLUMNS, 'question_id'),
  ]);
  const byId = new Map(states.map((s) => [s.question_id, s]));
  // Admins can read unpublished and binned shared questions; they stay out of
  // the bank.
  const visible = rows.filter(
    (r) => r.source !== 'seed' || (r.review_status === 'approved' && r.deleted_at === null),
  );
  const questions = visible.map((r): Question => {
    const s = byId.get(r.id);
    return {
      id: r.id,
      roundType: r.round_type,
      title: r.title,
      body: r.body,
      answer: r.answer ?? undefined,
      difficulty: r.difficulty,
      company: r.company,
      tags: r.tags,
      source: r.source,
      roleFamilies: r.role_families,
      personalAnswer: s?.personal_answer ?? undefined,
      personalNotes: s?.personal_notes ?? undefined,
      bookmarked: s?.bookmarked || undefined,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    };
  });
  const reviews = states
    .filter((s) => s.next_due !== null)
    .map(
      (s): ReviewState => ({
        questionId: s.question_id,
        confidence: s.confidence as Confidence,
        lastReviewed: s.last_reviewed === null ? undefined : Number(s.last_reviewed),
        nextDue: Number(s.next_due),
        intervalDays: s.interval_days,
        easeFactor: s.ease_factor,
        reviewCount: s.review_count,
      }),
    );
  const stateUpdatedAt = Object.fromEntries(
    states.map((s) => [s.question_id, Number(s.updated_at)]),
  );
  return { questions, reviews, stateUpdatedAt };
}

function getData(): QuestionData | undefined {
  return queryClient.getQueryData<QuestionData>(QUESTIONS_KEY);
}

function setData(fn: (d: QuestionData) => QuestionData) {
  queryClient.setQueryData<QuestionData>(QUESTIONS_KEY, (d) => (d ? fn(d) : d));
}

function patchQuestion(id: string, patch: Partial<Question>) {
  setData((d) => ({
    ...d,
    questions: d.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
  }));
}

/** Writes personal fields / review state for one question. */
export function saveQuestionState(
  questionId: string,
  fields: Partial<Omit<StateRow, 'question_id' | 'updated_at'>>,
  guardAnswer = false,
): Promise<void> {
  const now = Date.now();
  const base = getData()?.stateUpdatedAt[questionId] ?? 0;
  setData((d) => ({
    ...d,
    stateUpdatedAt: { ...d.stateUpdatedAt, [questionId]: now },
  }));
  return enqueue({
    type: 'upsert',
    table: 'user_question_state',
    rows: [{ question_id: questionId, ...fields, updated_at: now }],
    onConflict: 'user_id,question_id',
    guard: guardAnswer
      ? {
          entity: 'answer',
          entityId: questionId,
          match: { question_id: questionId },
          baseUpdatedAt: base,
          columns: ['personal_answer', 'personal_notes'],
        }
      : undefined,
  });
}

export async function updateQuestion(
  id: string,
  patch: Partial<Question>,
): Promise<void> {
  const now = Date.now();
  const personal: Partial<Omit<StateRow, 'question_id' | 'updated_at'>> = {};
  if ('personalAnswer' in patch) personal.personal_answer = patch.personalAnswer ?? null;
  if ('personalNotes' in patch) personal.personal_notes = patch.personalNotes ?? null;
  if ('bookmarked' in patch) personal.bookmarked = Boolean(patch.bookmarked);

  const content: Record<string, unknown> = {};
  if ('title' in patch) content.title = patch.title;
  if ('body' in patch) content.body = patch.body;
  if ('answer' in patch) content.answer = patch.answer ?? null;
  if ('roundType' in patch) content.round_type = patch.roundType;
  if ('difficulty' in patch) content.difficulty = patch.difficulty;
  if ('company' in patch) content.company = patch.company ?? [];
  if ('tags' in patch) content.tags = patch.tags ?? [];

  const hasContent = Object.keys(content).length > 0;
  patchQuestion(id, hasContent ? { ...patch, updatedAt: now } : patch);

  if (Object.keys(personal).length) {
    const guard = 'personalAnswer' in patch || 'personalNotes' in patch;
    void saveQuestionState(id, personal, guard);
  }
  // Content edits only apply to the user's own questions (enforced by RLS).
  if (hasContent) {
    void enqueue({
      type: 'update',
      table: 'questions',
      match: { id },
      patch: { ...content, updated_at: now },
    });
  }
}

export async function toggleBookmark(id: string): Promise<void> {
  const q = getData()?.questions.find((x) => x.id === id);
  if (!q) return;
  const bookmarked = !q.bookmarked;
  patchQuestion(id, { bookmarked: bookmarked || undefined });
  void saveQuestionState(id, { bookmarked });
}

export interface NewQuestionInput {
  title: string;
  body: string;
  answer?: string;
  roundType: RoundType;
  difficulty: Difficulty;
  company: string[];
  tags: string[];
}

export async function createQuestion(input: NewQuestionInput): Promise<string> {
  return createQuestions([input])[0];
}

/**
 * Adds questions to the user's own bank in one write. `source` is 'ai' for
 * questions generated from their resume or a JD.
 */
export function createQuestions(
  inputs: NewQuestionInput[],
  source: Exclude<Source, 'seed'> = 'user',
): string[] {
  const now = Date.now();
  const questions: Question[] = inputs.map((input, i) => ({
    id: uid(),
    roundType: input.roundType,
    title: input.title.trim(),
    body: input.body,
    answer: input.answer?.trim() ? input.answer : undefined,
    difficulty: input.difficulty,
    company: input.company,
    tags: input.tags,
    source,
    // keep the given order
    createdAt: now + i,
    updatedAt: now,
  }));
  setData((d) => ({ ...d, questions: [...d.questions, ...questions] }));
  // owner_id defaults to the signed-in user.
  void enqueue({
    type: 'upsert',
    table: 'questions',
    rows: questions.map((q) => ({
      id: q.id,
      round_type: q.roundType,
      title: q.title,
      body: q.body,
      answer: q.answer ?? null,
      difficulty: q.difficulty,
      company: q.company ?? [],
      tags: q.tags,
      source,
      created_at: q.createdAt,
      updated_at: now,
    })),
    onConflict: 'id',
  });
  return questions.map((q) => q.id);
}

export async function deleteQuestion(id: string): Promise<void> {
  setData((d) => ({
    ...d,
    questions: d.questions.filter((q) => q.id !== id),
    reviews: d.reviews.filter((r) => r.questionId !== id),
  }));
  // The user's state row for it is removed by ON DELETE CASCADE.
  void enqueue({ type: 'delete', table: 'questions', match: { id } });
}

/** Optimistically records a new review state (see sm2.reviewQuestion). */
export function putReviewState(state: ReviewState): void {
  setData((d) => ({
    ...d,
    reviews: [
      ...d.reviews.filter((r) => r.questionId !== state.questionId),
      state,
    ],
  }));
}

export function getCachedReviewState(questionId: string): ReviewState | undefined {
  return getData()?.reviews.find((r) => r.questionId === questionId);
}
