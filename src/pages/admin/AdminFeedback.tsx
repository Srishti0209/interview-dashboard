import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, Pencil, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminNav } from '@/components/admin/AdminNav';
import { useSession } from '@/hooks/useSession';
import {
  FEEDBACK_KEY,
  FEEDBACK_KIND_LABEL,
  fetchFeedback,
  setFeedbackResolved,
} from '@/lib/feedback';

/** /admin/feedback: problems reported on shared questions. */
export default function AdminFeedback() {
  const me = useSession()?.user.id;
  const { data, isLoading, error } = useQuery({ queryKey: FEEDBACK_KEY, queryFn: fetchFeedback, staleTime: 0 });
  const [view, setView] = useState<'open' | 'resolved'>('open');
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const items = (data ?? []).filter((f) => (view === 'open') === (f.resolvedAt === null));
  const openCount = (data ?? []).filter((f) => f.resolvedAt === null).length;

  const toggle = async (id: string, resolved: boolean) => {
    setBusy(id);
    setActionError('');
    try {
      await setFeedbackResolved(id, resolved, me);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <AdminNav />
      <h1 className="text-xl font-semibold tracking-tight">Feedback</h1>
      <p className="mb-4 text-sm text-muted-foreground">Problems your team reported on shared questions.</p>

      <div className="mb-3 flex gap-1">
        {(['open', 'resolved'] as const).map((v) => (
          <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} onClick={() => setView(v)}>
            {v === 'open' ? `Open (${openCount})` : 'Resolved'}
          </Button>
        ))}
      </div>
      {actionError && <p className="mb-2 text-sm text-destructive">{actionError}</p>}

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {view === 'open' ? 'No open reports.' : 'Nothing resolved yet.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((f) => (
            <Card key={f.id} className="space-y-2 p-4" data-testid="feedback-item">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{f.questionTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.createdAt).toLocaleString()} · {f.userId === me ? 'you' : 'a team member'}
                    {f.resolvedAt && ` · resolved ${new Date(f.resolvedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge variant="outline" className="font-normal">{FEEDBACK_KIND_LABEL[f.kind]}</Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm">{f.message}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/admin/questions/${f.questionId}`}>
                    <Pencil /> Edit question
                  </Link>
                </Button>
                <Button size="sm" variant={f.resolvedAt ? 'ghost' : 'default'} disabled={busy !== null}
                  onClick={() => void toggle(f.id, !f.resolvedAt)}>
                  {busy === f.id ? <Loader2 className="animate-spin" /> : f.resolvedAt ? <RotateCcw /> : <Check />}
                  {f.resolvedAt ? 'Reopen' : 'Mark resolved'}
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
