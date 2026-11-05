import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HandOffPanel } from '@/components/ai/HandOffPanel';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useProfile } from '@/hooks/useProfile';
import { roleTitle } from '@/lib/constants';
import { handOffPrompt, resumePrompts, type Candidate } from '@/lib/storyAi/prompts';
import {
  QUICK_STEPS,
  QUICK_STEP_LABEL,
  completedSteps,
  runQuickDrafts,
  useQuickDraftsStore,
} from '@/lib/storyAi/quickDrafts';
import { saveQuickDrafts } from '@/lib/storyAi/save';
import { quickDraftsSchema, type QuickDraftsResult } from '@/lib/storyAi/schemas';
import { cn } from '@/lib/utils';
import type { Resume } from '@/types';

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** e.g. "Added 3 draft stories and 2 resume questions." (zero parts omitted) */
function addedText({ stories, questions }: { stories: number; questions: number }) {
  const parts = [
    stories ? plural(stories, 'draft story', 'draft stories') : '',
    questions ? plural(questions, 'resume question', 'resume questions') : '',
  ].filter(Boolean);
  return parts.length ? `Added ${parts.join(' and ')}.` : 'Nothing new to add.';
}

interface Props {
  resume: Resume;
  /** Hide the "Review your drafts" link (e.g. already on the Story Bank). */
  onStoryBank?: boolean;
}

/**
 * Turns a resume into draft STAR stories and resume-based questions, either
 * automatically (Claude API) or via the "Do it in Claude" hand-off.
 */
export function GenerateFromResume({ resume, onStoryBank }: Props) {
  const profile = useProfile().data;
  const { status, isLoading } = useAiStatus();
  const run = useQuickDraftsStore((s) => s.runs[resume.id]);
  const [manual, setManual] = useState(false);
  const done = useQuery({
    queryKey: ['quick-drafts-done', resume.id, run?.status],
    queryFn: () => completedSteps(resume.id),
  }).data;

  const who: Candidate = {
    targetRole:
      profile?.targetRoleFamily && profile.targetLevel
        ? roleTitle(profile.targetRoleFamily, profile.targetLevel)
        : 'Software Engineer',
    currentPosition: profile?.currentPosition ?? '',
  };

  const counts = run?.status === 'done' ? run.counts : undefined;
  if (counts) {
    return (
      <div className="space-y-2 text-sm" data-testid="quick-drafts-done">
        <p className="flex items-center gap-2 font-medium">
          <Check className="size-4 text-emerald-600" />
          {addedText(counts)}
        </p>
        <p className="text-xs text-muted-foreground">
          Drafts only use what your resume says. Open one and choose <b>Deepen</b> to add the detail
          interviewers ask for.
        </p>
        {!onStoryBank && (
          <Button size="sm" variant="outline" asChild>
            <Link to="/stories">Review your drafts</Link>
          </Button>
        )}
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking AI availability…
      </p>
    );
  }

  if (run?.status === 'running') {
    const current = QUICK_STEPS.indexOf(run.step);
    return (
      <ol className="space-y-1.5 text-sm" data-testid="quick-drafts-progress">
        {QUICK_STEPS.map((step, i) => (
          <li
            key={step}
            className={cn('flex items-center gap-2', i > current && 'text-muted-foreground')}
          >
            {i < current || done?.includes(step) ? (
              <Check className="size-4 text-emerald-600" />
            ) : i === current ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="size-4" />
            )}
            {QUICK_STEP_LABEL[step]}
            <span className="text-xs text-muted-foreground">
              {i + 1}/{QUICK_STEPS.length}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  const error = run?.status === 'error' ? run.error : undefined;
  const handOff = manual || !status.enabled || status.remaining.resume <= 0 || error?.handOff;

  if (handOff) {
    const reason = !status.enabled
      ? 'Automatic generation isn’t available here, so run it in your own Claude account instead.'
      : status.remaining.resume <= 0
        ? 'You’ve used today’s automatic runs. You can still do it in Claude.'
        : error?.message;
    const parts = resumePrompts(resume.extractedText, who).all;
    return (
      <div className="space-y-2">
        <HandOffPanel<QuickDraftsResult>
          prompt={handOffPrompt(parts, quickDraftsSchema)}
          schema={quickDraftsSchema}
          reason={reason}
          importLabel="Import stories and questions"
          onImport={async (value) => {
            // Recorded like an automatic run, so the confirmation stays on
            // screen (the Story Bank banner) after the empty state goes away.
            const saved = await saveQuickDrafts(resume.id, value);
            useQuickDraftsStore.getState().set(resume.id, { status: 'done', step: 'questions', counts: saved });
          }}
        />
        {manual && status.enabled && (
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setManual(false)}>
            Generate automatically instead
          </Button>
        )}
      </div>
    );
  }

  const partial = done && done.length > 0 && done.length < QUICK_STEPS.length;
  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error.message}</p>}
      <Button size="sm" onClick={() => void runQuickDrafts(resume.id, who)}>
        <Sparkles />
        {error ? 'Retry' : partial ? 'Continue generating' : 'Generate draft stories and questions'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Sends your resume text to Claude.{' '}
        {status.fixture
          ? 'Test mode: returns sample data, no AI call.'
          : status.remaining.resume >= 1000
            ? 'No daily limit.'
            : `${status.remaining.resume} automatic ${status.remaining.resume === 1 ? 'run' : 'runs'} left today.`}{' '}
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setManual(true)}>
          Do it in Claude instead
        </Button>
      </p>
    </div>
  );
}
