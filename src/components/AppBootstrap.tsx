import { useEffect, useState } from 'react';
import { GraduationCap, Loader2, AlertTriangle } from 'lucide-react';
import { ensureSeeded } from '@/lib/seed';
import { Button } from '@/components/ui/button';

type Status = 'loading' | 'ready' | 'error';

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    ensureSeeded()
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            Couldn't load seed data
          </div>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
