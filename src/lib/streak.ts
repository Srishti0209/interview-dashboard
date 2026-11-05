import { startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { enqueue } from '@/lib/sync';

const KEY = 'studyLog';

/** ISO day strings (yyyy-mm-dd) on which at least one review happened. */
function readLog(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeLog(days: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(days));
}

function dayKey(ts: number): string {
  return startOfDay(ts).toISOString().slice(0, 10);
}

/**
 * Records today as a study day locally (so the streak updates instantly and
 * works offline) and in the account (so it follows the user across devices).
 */
export function logStudyDay(ts = Date.now()): void {
  const log = readLog();
  const key = dayKey(ts);
  if (!log.includes(key)) {
    log.push(key);
    writeLog(log);
    void enqueue({
      type: 'upsert',
      table: 'study_days',
      rows: [{ day: key }],
      onConflict: 'user_id,day',
      ignoreDuplicates: true,
    });
  }
}

/** Merges the account's study days into the local log (on app start). */
export async function syncStudyDays(): Promise<void> {
  const { data, error } = await supabase.from('study_days').select('day');
  if (error) throw error;
  const days = new Set([...readLog(), ...data.map((r) => String(r.day))]);
  writeLog([...days].sort());
}

/** Forgets the local log (on sign-out). */
export function clearStudyLog(): void {
  localStorage.removeItem(KEY);
}

/** Consecutive-day streak ending today (or yesterday). */
export function currentStreak(now = Date.now()): number {
  const days = new Set(readLog());
  if (days.size === 0) return 0;

  // Allow the streak to be "alive" if studied today or yesterday.
  let cursor = startOfDay(now).getTime();
  if (!days.has(dayKey(cursor))) {
    cursor -= 86_400_000;
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= 86_400_000;
  }
  return streak;
}

export function studiedToday(now = Date.now()): boolean {
  return readLog().includes(dayKey(now));
}

export function totalStudyDays(): number {
  return new Set(readLog()).size;
}
