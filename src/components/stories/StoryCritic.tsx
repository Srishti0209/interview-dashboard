import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Gauge, Loader2, MessagesSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HandOffPanel } from '@/components/ai/HandOffPanel';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useProfile } from '@/hooks/useProfile';
import { roleTitle } from '@/lib/constants';
import { AiError, aiPost } from '@/lib/storyAi/client';
import { critiquePrompts, handOffPrompt } from '@/lib/storyAi/prompts';
import { critiqueInput, saveCritique } from '@/lib/storyAi/save';
import { critiqueSchema, type CritiqueResult } from '@/lib/storyAi/schemas';
import { STAGES } from '@/lib/storyAi/stages';
import { cn } from '@/lib/utils';
import type { Story } from '@/types';

const barColour = (n: number) => (n >= 8 ? 'bg-emerald-500' : n >= 5 ? 'bg-amber-500' : 'bg-rose-500');

/** "Get feedback": scores the story per dimension and says what to add. */
export function StoryCritic({ story }: { story: Story }) {
  const navigate = useNavigate();
  const profile = useProfile().data;
  const { status } = useAiStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [manual, setManual] = useState(false);
  const critique = story.details?.critique;
  const targetRole =
    profile?.targetRoleFamily && profile.targetLevel
      ? roleTitle(profile.targetRoleFamily, profile.targetLevel)
      : 'Software Engineer';

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const c = await aiPost<CritiqueResult>('story-critique', { story: critiqueInput(story), targetRole });
      await saveCritique(story, c);
    } catch (e) {
      setError(e instanceof AiError ? e : new AiError('server_error', 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handOff = manual || (status && !status.enabled) || error?.handOff;
  const fixStage = critique?.fixStage && critique.fixStage >= 1 && critique.fixStage <= STAGES.length ? critique.fixStage : null;

  return (
    <Card className="p-4" data-testid="story-critic">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Gauge className="size-4 text-primary" /> Feedback
          {critique && (
            <span className="font-normal text-muted-foreground">
              · {critique.score}/10 · {formatDistanceToNow(critique.createdAt, { addSuffix: true })}
            </span>
          )}
        </h2>
        {!handOff && (
          <Button size="sm" variant={critique ? 'ghost' : 'default'} onClick={run} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : critique ? <RefreshCw /> : <Gauge />}
            {critique ? 'Check again' : 'Get feedback'}
          </Button>
        )}
      </div>

      {!critique && !handOff && (
        <p className="text-xs text-muted-foreground">
          An honest review from a senior interviewer’s point of view: a score for specificity, ownership, numbers,
          stakes, decisions, reflection and pacing, and exactly what to add.{' '}
          {status?.fixture && 'Test mode: sample feedback, no AI call. '}
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setManual(true)}>
            Do it in Claude instead
          </Button>
        </p>
      )}
      {error && !handOff && <p className="text-xs text-destructive">{error.message}</p>}

      {handOff && (
        <HandOffPanel<CritiqueResult>
          reason={error?.message}
          prompt={handOffPrompt(critiquePrompts(critiqueInput(story), targetRole), critiqueSchema)}
          schema={critiqueSchema}
          importLabel="Import feedback"
          onImport={async (c) => {
            await saveCritique(story, c);
            setManual(false);
            setError(null);
          }}
        />
      )}

      {critique && !handOff && (
        <div className="space-y-4">
          <ul className="space-y-2" data-testid="critique-dimensions">
            {critique.dimensions.map((d) => (
              <li key={d.name} className="text-xs">
                <div className="mb-0.5 flex justify-between gap-2">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.score}/10</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full', barColour(d.score))} style={{ width: `${d.score * 10}%` }} />
                </div>
                <p className="mt-0.5 text-muted-foreground">{d.note}</p>
              </li>
            ))}
          </ul>
          {critique.toAdd.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium">What to add</p>
              <ol className="list-decimal space-y-0.5 pl-5 text-sm">
                {critique.toAdd.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </div>
          )}
          {fixStage && (
            <Button size="sm" onClick={() => navigate(`/stories/${story.id}/build?stage=${fixStage}`)}>
              <MessagesSquare /> Fix with Builder: {STAGES[fixStage - 1].title}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
