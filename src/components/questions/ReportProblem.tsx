import { useState } from 'react';
import { Check, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FEEDBACK_KINDS, submitFeedback, type FeedbackKind } from '@/lib/feedback';
import { cn } from '@/lib/utils';

/** Flag button + dialog for reporting a problem with a shared question. */
export function ReportProblem({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>('wrong_answer');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setKind('wrong_answer');
      setMessage('');
      setSent(false);
      setError('');
    }
  };

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await submitFeedback(questionId, kind, message);
      setSent(true);
    } catch (e) {
      setError(navigator.onLine ? (e as Error).message : "You're offline. Try again when you're back online.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" title="Report a problem" aria-label="Report a problem" onClick={() => reset(true)}>
        <Flag className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={reset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a problem</DialogTitle>
            <DialogDescription>Tell us what's wrong with this question. An admin will review it.</DialogDescription>
          </DialogHeader>
          {sent ? (
            <p className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-600" /> Thanks, your report has been sent.
            </p>
          ) : (
            <div className="space-y-4">
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">What's the problem?</legend>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_KINDS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={kind === value}
                      onClick={() => setKind(value)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        kind === value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="report-message">Details</Label>
                <Textarea
                  id="report-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. The second key point is wrong because…"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            {sent ? (
              <Button onClick={() => reset(false)}>Done</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => reset(false)}>Cancel</Button>
                <Button onClick={() => void send()} disabled={busy || !message.trim()}>
                  {busy && <Loader2 className="animate-spin" />}
                  Send report
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
