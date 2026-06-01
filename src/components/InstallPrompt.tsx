import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  // Count sessions once per load.
  useEffect(() => {
    const n = Number(localStorage.getItem('sessionCount') ?? '0') + 1;
    localStorage.setItem('sessionCount', String(n));
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      const sessions = Number(localStorage.getItem('sessionCount') ?? '0');
      if (sessions >= 3 && !localStorage.getItem('installDismissed')) {
        setShow(true);
      }
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('installDismissed', '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  if (!show || !deferred) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[80] flex w-[min(90vw,26rem)] -translate-x-1/2 items-center gap-3 rounded-xl border bg-card p-3 shadow-2xl">
      <Download className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Install Interview Prep</p>
        <p className="text-xs text-muted-foreground">
          Add it to your home screen for offline study.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        Install
      </Button>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
