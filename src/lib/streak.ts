import { startOfDay } from 'date-fns';

const KEY = 'studyLog';

/** ISO day strings (yyyy-mm-dd) on which at least one review happened. */
function readLog(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function dayKey(ts: number): string {
  return startOfDay(ts).toISOString().slice(0, 10);
}

export function logStudyDay(ts = Date.now()): void {
  const log = readLog();
  const key = dayKey(ts);
  if (!log.includes(key)) {
    log.push(key);
    localStorage.setItem(KEY, JSON.stringify(log));
  }
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
