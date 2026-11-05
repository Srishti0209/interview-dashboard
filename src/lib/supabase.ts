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
