import { useEffect, useState } from 'react';
import { HardDriveUpload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  dismissLocalImport,
  findLocalData,
  importLocalData,
  localImportDismissed,
  localImportDone,
  type LocalDataSummary,
} from '@/lib/localImport';
import type { ImportSummary } from '@/lib/backup';

function describe(s: LocalDataSummary | ImportSummary): string {
  const parts = [
    [s.answers, 'answer'],
    [s.notes, 'note'],
    [s.stories, 'story'],
    [s.reviews, 'review'],
    [s.applications, 'application'],
    [s.mockSessions, 'mock session'],
    [s.ownQuestions, 'custom question'],
  ] as const;
  return parts
    .filter(([n]) => n > 0)
    .map(([n, label]) =>
      `${n} ${n === 1 ? label : label === 'story' ? 'stories' : label + 's'}`,
    )
    .join(', ');
}

/**
 * Offers (once per device) to copy data saved in this browser by the
 * local-first version of the app into the signed-in account.
 */
export function LocalImportBanner() {
  const [found, setFound] = useState<LocalDataSummary | null>(null);
  const [state, setState] = useState<'idle' | 'importing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (localImportDone() || localImportDismissed()) return;
    findLocalData()
      .then(setFound)
      .catch(() => undefined);
  }, []);

  if (!found && state !== 'done') return null;

  const run = async () => {
    setState('importing');
    try {
      const summary = await importLocalData();
      setMessage(describe(summary) || 'Nothing new to import');
      setState('done');
      setFound(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed.');
      setState('error');
    }
  };

  return (
    <div
      role="region"
      aria-label="Import local data"
      className="flex flex-wrap items-center gap-3 border-b bg-accent/50 px-4 py-3 text-sm"
    >
      <HardDriveUpload className="size-4 shrink-0 text-primary" />
      {state === 'done' ? (
        <span className="flex-1">
          Imported into your account: {message}.
        </span>
      ) : (
        <span className="min-w-0 flex-1">
          We found prep data saved in this browser
          {found ? ` (${describe(found)})` : ''}. Import it into your account
          so it's available on every device?
          {state === 'error' && (
            <span className="block text-xs text-destructive">{message}</span>
          )}
        </span>
      )}
      {state === 'done' ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={() => setState('idle')}
        >
          <X />
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" onClick={run} disabled={state === 'importing'}>
            {state === 'importing' && <Loader2 className="animate-spin" />}
            Import
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={state === 'importing'}
            onClick={() => {
              dismissLocalImport();
              setFound(null);
            }}
          >
            Not now
          </Button>
        </div>
      )}
    </div>
  );
}
