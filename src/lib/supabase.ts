import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when the Supabase env vars are missing (see .env.example). */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  url ?? 'http://localhost',
  anonKey ?? 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Picks up the session from the magic-link redirect URL.
      detectSessionInUrl: true,
    },
  },
);

/**
 * Whether Google sign-in is switched on in the Supabase project
 * (Authentication → Sign In / Providers), read from the public auth settings.
 */
export async function googleSignInEnabled(): Promise<boolean> {
  if (!supabaseConfigured) return false;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey! },
    });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}
