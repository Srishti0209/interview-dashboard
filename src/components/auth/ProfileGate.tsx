import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import Onboarding from '@/pages/Onboarding';
import SetPassword, { needsPassword } from '@/pages/SetPassword';

/**
 * Sends users who haven't finished setup to onboarding, after asking those who
 * signed in by email link to create a password.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { data: profile, isError, error, refetch } = useProfile();
  const session = useSession();
  const [passwordStepDone, setPasswordStepDone] = useState(false);

  if (isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          Couldn't load your profile
        </div>
        <p className="text-xs text-muted-foreground">{error.message}</p>
        <Button size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile.onboarded) {
    if (!passwordStepDone && needsPassword(session)) {
      return <SetPassword onDone={() => setPasswordStepDone(true)} />;
    }
    return <Onboarding profile={profile} />;
  }

  return <>{children}</>;
}
