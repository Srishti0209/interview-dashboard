import Dexie from 'dexie';
import { db } from '@/lib/db';
import { importAll, type BackupFile, type ImportSummary } from '@/lib/backup';

/**
 * One-time move of data saved in this browser by the local-first version of
 * the app (IndexedDB "InterviewPrep") into the signed-in account.
 */

const DONE_KEY = 'localImport:done';
const DISMISSED_KEY = 'localImport:dismissed';

export interface LocalDataSummary {
  answers: number;
  reviews: number;
  notes: number;
  stories: number;
  applications: number;
  mockSessions: number;
  ownQuestions: number;
}

export function localImportDone(): boolean {
  return localStorage.getItem(DONE_KEY) !== null;
}

export function localImportDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) !== null;
}

export function dismissLocalImport(): void {
  localStorage.setItem(DISMISSED_KEY, String(Date.now()));
}

/** What the old local database holds, or null if there's nothing to import. */
export async function findLocalData(): Promise<LocalDataSummary | null> {
  // Checking first avoids creating an empty database for new users.
  if (!(await Dexie.exists('InterviewPrep'))) return null;
  const [questions, reviews, notes, stories, companies, mockSessions] =
    await Promise.all([
      db.questions.toArray(),
      db.reviewStates.count(),
      db.notes.count(),
      db.stories.count(),
      db.companies.toArray(),
      db.mockSessions.count(),
    ]);
  const summary: LocalDataSummary = {
    answers: questions.filter((q) => q.personalAnswer?.trim()).length,
    reviews,
    notes,
    stories,
    applications: companies.filter(
      (c) => c.applicationStatus || c.applicationNotes || c.applicationDates?.length,
    ).length,
    mockSessions,
    ownQuestions: questions.filter((q) => q.source === 'user').length,
  };
  // Stories count too: in the local-first version the story bank was the
  // user's own (seeded from their resume and edited in place).
  const personal =
    summary.stories +
    summary.answers +
    summary.reviews +
    summary.notes +
    summary.applications +
    summary.mockSessions +
    summary.ownQuestions +
    questions.filter((q) => q.personalNotes?.trim() || q.bookmarked).length;
  return personal > 0 ? summary : null;
}

async function readLocalBackup(): Promise<BackupFile> {
  const [questions, reviewStates, notes, stories, companies, mockSessions] =
    await Promise.all([
      db.questions.toArray(),
      db.reviewStates.toArray(),
      db.notes.toArray(),
      db.stories.toArray(),
      db.companies.toArray(),
      db.mockSessions.toArray(),
    ]);
  const studyLog = localStorage.getItem('studyLog');
  return {
    app: 'interview-prep-pwa',
    version: 1,
    exportedAt: Date.now(),
    tables: { questions, reviewStates, notes, stories, companies, mockSessions },
    localStorage: studyLog ? { studyLog } : {},
  };
}

/**
 * Copies the local data into the account (merging, never deleting). The
 * local database is left in place as a fallback copy.
 */
export async function importLocalData(): Promise<ImportSummary> {
  const summary = await importAll(await readLocalBackup(), 'merge');
  localStorage.setItem(DONE_KEY, String(Date.now()));
  return summary;
}
