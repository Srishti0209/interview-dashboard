import { db } from '@/lib/db';
import type { SeedData } from '@/types';

const SEED_VERSION_KEY = 'seedVersion';

/**
 * Loads `/seed/seed.json` into IndexedDB.
 *
 * Re-seeding rules (acceptance criteria #8):
 * - Questions: update seed content in place, but PRESERVE the user's
 *   personalAnswer, personalNotes, and bookmarked flag.
 * - Companies: update seed content, but PRESERVE applicationStatus,
 *   applicationNotes, and applicationDates.
 * - Stories: only insert if missing (never clobber a user-edited story).
 * - ReviewStates / Notes / MockSessions are never touched by seeding.
 */
export async function ensureSeeded(): Promise<void> {
  const seededVersion = localStorage.getItem(SEED_VERSION_KEY);

  const res = await fetch(`${import.meta.env.BASE_URL}seed/seed.json`);
  if (!res.ok) {
    throw new Error(`Failed to load seed.json (${res.status})`);
  }
  const data = (await res.json()) as SeedData;

  if (seededVersion === String(data.version)) return;

  await db.transaction(
    'rw',
    db.questions,
    db.stories,
    db.companies,
    async () => {
      for (const q of data.questions) {
        const existing = await db.questions.get(q.id);
        if (existing) {
          await db.questions.put({
            ...q,
            personalAnswer: existing.personalAnswer,
            personalNotes: existing.personalNotes,
            bookmarked: existing.bookmarked,
            // keep the original creation time, refresh updatedAt
            createdAt: existing.createdAt ?? q.createdAt,
            updatedAt: Date.now(),
          });
        } else {
          await db.questions.put(q);
        }
      }

      for (const s of data.stories) {
        const existing = await db.stories.get(s.id);
        if (!existing) await db.stories.put(s);
      }

      for (const c of data.companies) {
        const existing = await db.companies.get(c.id);
        if (existing) {
          await db.companies.put({
            ...c,
            applicationStatus: existing.applicationStatus,
            applicationNotes: existing.applicationNotes,
            applicationDates: existing.applicationDates,
          });
        } else {
          await db.companies.put(c);
        }
      }
    },
  );

  localStorage.setItem(SEED_VERSION_KEY, String(data.version));
}

/**
 * Force a re-seed on next call (used by Settings → "Reset to seed").
 * Clears the stored version so ensureSeeded() re-applies seed content
 * while still preserving user-owned fields per the rules above.
 */
export function clearSeedVersion(): void {
  localStorage.removeItem(SEED_VERSION_KEY);
}
