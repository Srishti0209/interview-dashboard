import { supabase } from '@/lib/supabase';

// Calls to the admin-only server functions in api/admin/*.
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again.');
  let res: Response;
  try {
    res = await fetch(`/api/admin/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch {
    throw new Error('You seem to be offline.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? 'Something went wrong. Try again.');
  return body as T;
}

export const adminGet = <T,>(path: string) => call<T>(path);
export const adminPost = <T,>(path: string, body: unknown) =>
  call<T>(path, { method: 'POST', body: JSON.stringify(body) });
