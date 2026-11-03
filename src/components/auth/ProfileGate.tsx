import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import Onboarding from '@/pages/Onboarding';

/** Sends users who haven't finished setup to onboarding. */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { data: profile, isError, error, refetch } = useProfile();

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

  if (!profile.onboarded) return <Onboarding profile={profile} />;

  return <>{children}</>;
}
