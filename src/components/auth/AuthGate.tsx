import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SessionContext, useSupabaseSession } from '@/hooks/useSession';
import { supabaseConfigured } from '@/lib/supabase';
import { clearStudyLog } from '@/lib/streak';
import { clearOutbox, setSyncUser } from '@/lib/sync';
import SignIn from '@/pages/SignIn';

/** Renders the app only for signed-in users; everyone else sees SignIn. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useSupabaseSession();
  const qc = useQueryClient();

  // Never show one user's cached data to the next user on this device.
  useEffect(() => {
    if (session === null) {
      qc.clear();
      clearStudyLog();
      clearOutbox();
      setSyncUser(null);
    }
  }, [session, qc]);

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Supabase isn't configured. Copy .env.example to .env.local and fill in
        VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
      </div>
    );
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <SignIn />;

  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}
