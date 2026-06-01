import { db } from '@/lib/db';
import { uid } from '@/lib/utils';
import type { Question, RoundType, Difficulty } from '@/types';

export async function updateQuestion(
  id: string,
  patch: Partial<Question>,
): Promise<void> {
  await db.questions.update(id, { ...patch, updatedAt: Date.now() });
}

export async function toggleBookmark(id: string): Promise<void> {
  const q = await db.questions.get(id);
  if (!q) return;
  await db.questions.update(id, {
    bookmarked: !q.bookmarked,
    updatedAt: Date.now(),
  });
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
  const now = Date.now();
  const q: Question = {
    id: uid(),
    roundType: input.roundType,
    title: input.title.trim(),
    body: input.body,
    answer: input.answer?.trim() ? input.answer : undefined,
    difficulty: input.difficulty,
    company: input.company,
    tags: input.tags,
    source: 'user',
    createdAt: now,
    updatedAt: now,
  };
  await db.questions.put(q);
  return q.id;
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.transaction('rw', db.questions, db.reviewStates, async () => {
    await db.questions.delete(id);
    await db.reviewStates.delete(id);
  });
}
