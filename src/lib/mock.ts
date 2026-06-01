import { db } from '@/lib/db';
import { uid } from '@/lib/utils';
import type { MockSession, Question, RoundType } from '@/types';

/** Pick one random question per round type, preferring the target company. */
export function pickMockQuestions(
  questions: Question[],
  roundTypes: RoundType[],
  companyName?: string,
): Question[] {
  const picked: Question[] = [];
  for (const rt of roundTypes) {
    const pool = questions.filter((q) => q.roundType === rt);
    if (pool.length === 0) continue;
    const preferred = companyName
      ? pool.filter((q) =>
          q.company?.some((c) => c.toLowerCase() === companyName.toLowerCase()),
        )
      : [];
    const from = preferred.length ? preferred : pool;
    picked.push(from[Math.floor(Math.random() * from.length)]);
  }
  return picked;
}

export async function saveMockSession(
  session: Omit<MockSession, 'id'>,
): Promise<string> {
  const id = uid();
  await db.mockSessions.put({ id, ...session });
  return id;
}

export async function deleteMockSession(id: string): Promise<void> {
  await db.mockSessions.delete(id);
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
