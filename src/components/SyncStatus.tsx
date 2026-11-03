import { AlertTriangle, CloudOff, Loader2, RotateCw } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { queryClient } from '@/lib/queryClient';

/**
 * Account sync state: offline with N queued changes, syncing, or a failed
 * save. Renders nothing when everything is saved.
 */
export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const { pending, online, error } = useSyncStatus();

  let icon: React.ReactNode;
  let label: string;
  let action: React.ReactNode = null;

  if (!online) {
    icon = <CloudOff className="size-3.5" />;
    label = pending
      ? `Offline · ${pending} change${pending === 1 ? '' : 's'} waiting to sync`
      : 'Offline';
  } else if (pending) {
    icon = <Loader2 className="size-3.5 animate-spin" />;
    label = `Syncing ${pending} change${pending === 1 ? '' : 's'}…`;
  } else if (error) {
    icon = <AlertTriangle className="size-3.5 text-destructive" />;
    label = "Couldn't save a change";
    action = (
      <button
        type="button"
        onClick={() => void queryClient.invalidateQueries()}
        className="ml-auto rounded p-0.5 hover:bg-sidebar-accent"
        title="Reload your data"
        aria-label="Reload your data"
      >
        <RotateCw className="size-3.5" />
      </button>
    );
  } else {
    return null;
  }

  return (
    <div
      role="status"
      title={error ?? label}
      className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground"
    >
      {icon}
      {!compact && <span className="min-w-0 truncate">{label}</span>}
      {action}
    </div>
  );
}
