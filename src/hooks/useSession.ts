import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { pendingSyncCount } from '@/lib/sync';

/**
 * Subscribes to Supabase auth. `undefined` while the stored session is still
 * being restored, `null` when signed out. Used once, by AuthGate.
 */
export function useSupabaseSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return session;
}

export const SessionContext = createContext<Session | null>(null);

/** The signed-in session (always set inside AuthGate). */
export function useSession(): Session | null {
  return useContext(SessionContext);
}

export async function signOut(): Promise<void> {
  const pending = pendingSyncCount();
  if (
    pending > 0 &&
    !window.confirm(
      `${pending} change${pending === 1 ? " hasn't" : "s haven't"} synced to your account yet. Signing out now will lose ${pending === 1 ? 'it' : 'them'}. Sign out anyway?`,
    )
  )
    return;
  await supabase.auth.signOut();
}
