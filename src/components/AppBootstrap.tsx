import { useEffect, useState } from 'react';
import { useIsRestoring } from '@tanstack/react-query';
import { GraduationCap, Loader2, AlertTriangle } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { QUESTIONS_KEY, fetchQuestionData } from '@/lib/questions';
import { syncStudyDays } from '@/lib/streak';
import { replayOutbox, setSyncUser } from '@/lib/sync';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';

type Status = 'loading' | 'ready' | 'error';

/**
 * Waits for the question bank before showing the app: instantly from the
 * on-device cache when there is one (including offline), otherwise from the
 * account.
 */
export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const restoring = useIsRestoring();
  const userId = useSession()?.user.id ?? null;
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string>('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (restoring) return;
    let cancelled = false;
    // Re-send edits that hadn't synced when the app last closed.
    setSyncUser(userId);
    replayOutbox();
    queryClient
      .ensureQueryData({ queryKey: QUESTIONS_KEY, queryFn: fetchQuestionData })
      .then(() => {
        if (cancelled) return;
        setStatus('ready');
        // Cached data shows instantly; refresh it in the background so edits
        // made on another device appear.
        void queryClient.invalidateQueries();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
    // Streak days from other devices; not needed to start.
    syncStudyDays().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [restoring, attempt, userId]);

  if (status === 'ready') return <>{children}</>;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-6 text-primary" />
        <span className="text-sm font-semibold tracking-tight">
          Interview Prep
        </span>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your question bank…
        </div>
      )}

      {status === 'error' && (
        <div className="flex max-w-sm flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" />
            Couldn't load your question bank
          </div>
          <p className="text-xs text-muted-foreground">
            {navigator.onLine
              ? error
              : "You're offline. Connect once to download your data; after that it works offline."}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setStatus('loading');
              setAttempt((a) => a + 1);
            }}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
