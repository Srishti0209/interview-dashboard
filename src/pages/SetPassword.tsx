import { GraduationCap } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { PasswordForm } from '@/components/auth/PasswordForm';

/** How this session signed in, from the access token's `amr` claim. */
function signInMethods(session: Session): string[] {
  try {
    const payload = session.access_token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const amr = (JSON.parse(json) as { amr?: { method: string }[] }).amr;
    return (amr ?? []).map((a) => a.method);
  } catch {
    return [];
  }
}

/**
 * New users who arrived by email link are asked for a password first, so they
 * don't need another link next time. Not shown after a password or Google
 * sign-in, or once a password has been set.
 */
export function needsPassword(session: Session | null): boolean {
  if (!session || session.user.user_metadata?.password_set === true) return false;
  const methods = signInMethods(session);
  return methods.length > 0 && !methods.some((m) => m === 'password' || m === 'oauth');
}

/** First step for new users: create a password, then onboarding. */
export default function SetPassword({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex min-h-svh items-start justify-center p-6 sm:items-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="text-sm font-semibold tracking-tight">
            Interview Prep
          </span>
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Create a password</h1>
          <p className="text-sm text-muted-foreground">
            Next time, sign in with your email and this password instead of
            waiting for an email link.
          </p>
        </div>
        <PasswordForm submitLabel="Continue" onDone={onDone} />
        <button
          type="button"
          onClick={onDone}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
