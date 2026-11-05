// Admin-only endpoints (api/admin/*): the caller must be signed in and have
// profiles.is_admin. Uses the service role, so check before doing anything.
import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticate, type Caller } from './auth.js';
import { HttpError } from './http.js';

export async function requireAdmin(req: Request): Promise<Caller> {
  const caller = await authenticate(req);
  const { data, error } = await caller.admin
    .from('profiles')
    .select('is_admin')
    .eq('id', caller.userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.is_admin) throw new HttpError(403, 'forbidden', 'Only admins can do this.');
  return caller;
}

/** Every row of a table (PostgREST returns at most 1000 per request). */
export async function selectAll<T>(
  admin: SupabaseClient,
  table: string,
  columns: string,
  where: { positive?: string; nonEmpty?: string; since?: [string, string] } = {},
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = admin.from(table).select(columns);
    if (where.positive) q = q.gt(where.positive, 0);
    if (where.nonEmpty) q = q.not(where.nonEmpty, 'is', null).neq(where.nonEmpty, '');
    if (where.since) q = q.gte(where.since[0], where.since[1]);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (data.length < 1000) return rows;
  }
}
