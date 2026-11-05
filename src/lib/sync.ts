import { MutationObserver, type Mutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { uid } from '@/lib/utils';

/**
 * Offline-first write queue.
 *
 * Every write to the account goes through `enqueue()`: callers update the
 * cached data first (so the UI changes instantly), then enqueue the matching
 * database operation. Operations run one at a time, in order, retry on
 * failure and pause while offline.
 *
 * Each operation is also recorded synchronously in a localStorage "outbox"
 * before `enqueue()` returns, and removed only once the server has it. On the
 * next start, anything left in the outbox is replayed, so an edit survives a
 * reload or closed tab at any moment (even mid-request).
 *
 * All operations are idempotent (upserts, keyed updates and deletes), so an
 * operation interrupted mid-flight can safely run again.
 */

/** Keeps the version being overwritten when another device edited it since. */
export interface ConflictGuard {
  entity: 'note' | 'answer';
  entityId: string;
  /** Row to compare against, e.g. { id } or { question_id }. */
  match: Record<string, unknown>;
  /** updated_at of the row this edit was based on. */
  baseUpdatedAt: number;
  /** Columns to snapshot into `revisions` if a newer version exists. */
  columns: string[];
}

export type SyncOp =
  | {
      type: 'upsert';
      table: string;
      rows: Record<string, unknown>[];
      onConflict?: string;
      /** Skip rows that already exist (ON CONFLICT DO NOTHING). */
      ignoreDuplicates?: boolean;
      guard?: ConflictGuard;
    }
  | {
      type: 'update';
      table: string;
      match: Record<string, unknown>;
      patch: Record<string, unknown>;
      guard?: ConflictGuard;
    }
  | { type: 'delete'; table: string; match: Record<string, unknown> };

export const SYNC_KEY = ['sync'] as const;

async function preserveConflict(table: string, guard: ConflictGuard) {
  const { data, error } = await supabase
    .from(table)
    .select([...guard.columns, 'updated_at'].join(','))
    .match(guard.match)
    .maybeSingle();
  if (error) throw error;
  const row = data as Record<string, unknown> | null;
  if (!row || Number(row.updated_at) <= guard.baseUpdatedAt) return;
  const { error: revError } = await supabase.from('revisions').insert({
    entity: guard.entity,
    entity_id: guard.entityId,
    content: row,
  });
  if (revError) throw revError;
}

export async function runOp(op: SyncOp): Promise<void> {
  if (op.type !== 'delete' && op.guard) await preserveConflict(op.table, op.guard);

  const table = supabase.from(op.table);
  const { error } =
    op.type === 'upsert'
      ? await table.upsert(op.rows, {
          onConflict: op.onConflict,
          ignoreDuplicates: op.ignoreDuplicates,
        })
      : op.type === 'update'
        ? await table.update(op.patch).match(op.match)
        : await table.delete().match(op.match);
  if (error) throw error;
}

/** Last sync failure, shown by the sync indicator until the next success. */
let lastError: string | null = null;
const errorListeners = new Set<() => void>();
export const syncError = {
  get: () => lastError,
  subscribe(fn: () => void) {
    errorListeners.add(fn);
    return () => errorListeners.delete(fn);
  },
};
function setLastError(message: string | null) {
  if (message === lastError) return;
  lastError = message;
  errorListeners.forEach((fn) => fn());
}

/**
 * Connection failures (no response at all) are worth retrying forever:
 * the edit is kept until the server is reachable. Errors the server returned
 * (e.g. permission denied) won't fix themselves, so those give up.
 */
export function isNetworkError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return Boolean(
    e && !e.code && /fetch|network|load failed|timed? ?out/i.test(e.message ?? ''),
  );
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------
const OUTBOX_KEY = 'sync-outbox';

interface OutboxEntry {
  id: string;
  userId: string | null;
  op: SyncOp;
}

/** The signed-in user; outbox entries only replay for the user who made them. */
let currentUser: string | null = null;
export function setSyncUser(userId: string | null): void {
  currentUser = userId;
}

function readOutbox(): OutboxEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeOutbox(entries: OutboxEntry[]): void {
  try {
    if (entries.length) localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
    else localStorage.removeItem(OUTBOX_KEY);
  } catch {
    // Storage full: the write still runs from memory, it just won't survive
    // a reload before it syncs.
  }
}

function removeFromOutbox(id: string): void {
  writeOutbox(readOutbox().filter((e) => e.id !== id));
}

/** Drops unsynced writes (on sign-out). */
export function clearOutbox(): void {
  localStorage.removeItem(OUTBOX_KEY);
}

queryClient.setMutationDefaults(SYNC_KEY, {
  mutationFn: async (entry: OutboxEntry) => {
    await runOp(entry.op);
    removeFromOutbox(entry.id);
  },
  scope: { id: 'sync' },
  networkMode: 'online',
  retry: (failures, error) => isNetworkError(error) || failures < 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  onSuccess: () => setLastError(null),
  onError: (error: Error, entry: OutboxEntry) => {
    // The server rejected it; retrying later won't help.
    removeFromOutbox(entry.id);
    setLastError(error.message || 'Could not save a change.');
    // The optimistic change didn't stick: reload the real data.
    void queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] !== 'profile',
    });
  },
});

function run(entry: OutboxEntry): Promise<void> {
  return new MutationObserver<void, Error, OutboxEntry>(queryClient, {
    mutationKey: SYNC_KEY,
  })
    .mutate(entry)
    .catch(() => undefined);
}

/**
 * Queues a database write. The returned promise resolves once the server has
 * it; callers normally don't wait for that — the edit is already applied on
 * the device, and the outbox keeps it until it syncs.
 */
export function enqueue(op: SyncOp): Promise<void> {
  const entry: OutboxEntry = { id: uid(), userId: currentUser, op };
  writeOutbox([...readOutbox(), entry]);
  return run(entry);
}

/** Re-sends writes left over from a previous session (in order). */
export function replayOutbox(): void {
  const entries = readOutbox();
  const mine = entries.filter((e) => e.userId === currentUser);
  if (mine.length !== entries.length) writeOutbox(mine);
  const running = new Set(
    queryClient
      .getMutationCache()
      .findAll({ mutationKey: SYNC_KEY, status: 'pending' })
      .map((m) => (m.state.variables as OutboxEntry | undefined)?.id),
  );
  for (const entry of mine) if (!running.has(entry.id)) void run(entry);
}

function pendingSync(): Mutation<unknown, Error, unknown>[] {
  return queryClient
    .getMutationCache()
    .findAll({ mutationKey: SYNC_KEY, status: 'pending' });
}

export function pendingSyncCount(): number {
  return Math.max(pendingSync().length, readOutbox().length);
}

/**
 * Waits (bounded) for queued writes to finish, so a refetch doesn't briefly
 * show data from before the user's latest edits. Skipped while offline.
 */
export async function waitForPendingWrites(timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (pendingSync().length > 0 && navigator.onLine && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }
}
