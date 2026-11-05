import { Check, CloudOff, Loader2 } from 'lucide-react';
import { useOnline } from '@/hooks/useSyncStatus';

export function SaveStatus({
  status,
}: {
  status: 'idle' | 'saving' | 'saved';
}) {
  const online = useOnline();
  if (status === 'saved' && !online)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CloudOff className="size-3" /> Saved on this device · syncs when online
      </span>
    );
  if (status === 'saving')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Saving…
      </span>
    );
  if (status === 'saved')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" /> Saved
      </span>
    );
  return null;
}
