import { db } from '@/lib/db';
import { ensureSeeded, clearSeedVersion } from '@/lib/seed';

const LS_KEYS = [
  'seedVersion',
  'studyLog',
  'interview-prep-ui',
  'mockSessionCount',
];

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
  };
  localStorage: Record<string, string>;
}

export async function exportAll(): Promise<BackupFile> {
  const [questions, reviewStates, notes, stories, companies, mockSessions] =
    await Promise.all([
      db.questions.toArray(),
      db.reviewStates.toArray(),
      db.notes.toArray(),
      db.stories.toArray(),
      db.companies.toArray(),
      db.mockSessions.toArray(),
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
    tables: { questions, reviewStates, notes, stories, companies, mockSessions },
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

export async function importAll(data: BackupFile): Promise<void> {
  if (data.app !== 'interview-prep-pwa' || !data.tables) {
    throw new Error('Not a valid Interview Prep backup file.');
  }
  await db.transaction(
    'rw',
    [
      db.questions,
      db.reviewStates,
      db.notes,
      db.stories,
      db.companies,
      db.mockSessions,
    ],
    async () => {
      await Promise.all([
        db.questions.clear(),
        db.reviewStates.clear(),
        db.notes.clear(),
        db.stories.clear(),
        db.companies.clear(),
        db.mockSessions.clear(),
      ]);
      await db.questions.bulkPut(data.tables.questions as never);
      await db.reviewStates.bulkPut(data.tables.reviewStates as never);
      await db.notes.bulkPut(data.tables.notes as never);
      await db.stories.bulkPut(data.tables.stories as never);
      await db.companies.bulkPut(data.tables.companies as never);
      await db.mockSessions.bulkPut(data.tables.mockSessions as never);
    },
  );

  for (const [k, v] of Object.entries(data.localStorage ?? {})) {
    localStorage.setItem(k, v);
  }
}

/**
 * Re-applies seed content (picking up content improvements) while preserving
 * all user-owned data per the ensureSeeded() rules.
 */
export async function resetToSeed(): Promise<void> {
  clearSeedVersion();
  await ensureSeeded();
}
