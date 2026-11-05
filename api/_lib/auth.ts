// Verifies the caller's Supabase session and returns two clients:
// `db` acts as the user (row-level security applies, so it can only read the
// caller's own resumes, stories and JDs); `admin` uses the service role and is
// only for writing ai_usage, which users can read but not write.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './http.js';

export interface Caller {
  userId: string;
  db: SupabaseClient;
  admin: SupabaseClient;
}

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export async function authenticate(req: Request): Promise<Caller> {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, 'unauthorized', 'Please sign in again.');

  const url = env('VITE_SUPABASE_URL');
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, env('SUPABASE_SERVICE_ROLE_KEY'), noSession);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Please sign in again.');

  const db = createClient(url, env('VITE_SUPABASE_ANON_KEY'), {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { userId: data.user.id, db, admin };
}
