import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { enqueue, waitForPendingWrites } from '@/lib/sync';
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

export const MOCK_SESSIONS_KEY = ['mockSessions'] as const;

interface MockSessionRow {
  id: string;
  started_at: number;
  ended_at: number | null;
  round_types: RoundType[];
  company_id: string | null;
  self_rating: number | null;
  notes: string | null;
}

/** All mock sessions, newest first. */
export async function fetchMockSessions(): Promise<MockSession[]> {
  await waitForPendingWrites();
  const rows = await fetchAll<MockSessionRow>(
    'mock_sessions',
    'id, started_at, ended_at, round_types, company_id, self_rating, notes',
    'id',
  );
  return rows
    .map((r) => ({
      id: r.id,
      startedAt: Number(r.started_at),
      endedAt: r.ended_at === null ? undefined : Number(r.ended_at),
      roundTypes: r.round_types,
      companyId: r.company_id ?? undefined,
      selfRating: r.self_rating ?? undefined,
      notes: r.notes ?? undefined,
    }))
    .sort((a, b) => b.startedAt - a.startedAt);
}

function setSessions(fn: (s: MockSession[]) => MockSession[]) {
  queryClient.setQueryData<MockSession[]>(MOCK_SESSIONS_KEY, (s) =>
    s ? fn(s) : s,
  );
}

export async function saveMockSession(
  session: Omit<MockSession, 'id'>,
): Promise<string> {
  const id = uid();
  setSessions((s) =>
    [{ id, ...session }, ...s].sort((a, b) => b.startedAt - a.startedAt),
  );
  void enqueue({
    type: 'upsert',
    table: 'mock_sessions',
    rows: [
      {
        id,
        started_at: session.startedAt,
        ended_at: session.endedAt ?? null,
        round_types: session.roundTypes,
        company_id: session.companyId ?? null,
        self_rating: session.selfRating ?? null,
        notes: session.notes ?? null,
      },
    ],
    onConflict: 'id',
  });
  return id;
}

export async function deleteMockSession(id: string): Promise<void> {
  setSessions((s) => s.filter((x) => x.id !== id));
  void enqueue({ type: 'delete', table: 'mock_sessions', match: { id } });
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
