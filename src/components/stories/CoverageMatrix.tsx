import { Link } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { COMPETENCIES } from '@/lib/storyAi/schemas';
import { cn } from '@/lib/utils';
import type { Story } from '@/types';

/** Words that identify each competency in free-text tags ("conflict resolution" → Conflict). */
const KEYS: Record<(typeof COMPETENCIES)[number], string[]> = {
  Ownership: ['ownership', 'owner', 'accountab'],
  Leadership: ['leadership', 'leading', 'lead '],
  Conflict: ['conflict'],
  Failure: ['failure', 'mistake', 'setback'],
  'Influence without authority': ['influence', 'persua', 'stakeholder'],
  Ambiguity: ['ambigu', 'uncertain'],
  'Customer focus': ['customer', 'user focus', 'client'],
  'Delivery under pressure': ['pressure', 'deadline', 'delivery'],
  'Technical depth': ['technical', 'architecture'],
  Mentoring: ['mentor', 'coaching', 'teaching'],
  Prioritisation: ['prioriti'],
  'Learning fast': ['learning', 'learn'],
  'Disagree and commit': ['disagree', 'commit'],
  'Impact and metrics': ['impact', 'metric', 'results'],
};

export function storyCompetencies(story: Story): string[] {
  const tags = [...(story.details?.bestFor ?? []), ...story.applicableTo].map((t) => ` ${t.toLowerCase()} `);
  return COMPETENCIES.filter((c) => tags.some((t) => KEYS[c].some((k) => t.includes(k))));
}

/** The story's best known score: the write-up's, else the critic's. */
const scoreOf = (s: Story) => s.details?.score ?? s.details?.critique?.score;

function strength(s: Story): 'strong' | 'ok' | 'draft' {
  const n = scoreOf(s);
  return n === undefined ? 'draft' : n >= 8 ? 'strong' : n >= 5 ? 'ok' : 'draft';
}

const CHIP = {
  strong: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  ok: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  draft: 'border-border bg-muted/50 text-muted-foreground',
};

/** Competencies × stories: which ones you can answer, how strongly, and the gaps. */
export function CoverageMatrix({ stories, onBuild }: { stories: Story[]; onBuild: (competency: string) => void }) {
  const rows = COMPETENCIES.map((c) => ({
    competency: c,
    stories: stories
      .filter((s) => storyCompetencies(s).includes(c))
      .sort((a, b) => (scoreOf(b) ?? 0) - (scoreOf(a) ?? 0)),
  }));
  const covered = rows.filter((r) => r.stories.length).length;
  const strong = rows.filter((r) => r.stories.some((s) => strength(s) === 'strong')).length;

  return (
    <div className="space-y-3" data-testid="coverage-matrix">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {covered} of {COMPETENCIES.length}
        </span>{' '}
        competencies have a story; <span className="font-medium text-foreground">{strong}</span> have a strong one (8/10
        or more). Interviewers usually probe 6–10 of these in a behavioural round.
      </p>
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className={cn('size-2.5 rounded-sm border', CHIP.strong)} /> Strong (8+)</span>
        <span className="flex items-center gap-1"><span className={cn('size-2.5 rounded-sm border', CHIP.ok)} /> OK (5–7)</span>
        <span className="flex items-center gap-1"><span className={cn('size-2.5 rounded-sm border', CHIP.draft)} /> Draft or unscored</span>
      </div>
      <Card className="divide-y p-0">
        {rows.map((r) => (
          <div
            key={r.competency}
            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
            data-testid="coverage-row"
            data-covered={r.stories.length > 0}
          >
            <div className="w-56 shrink-0 text-sm font-medium">{r.competency}</div>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {r.stories.length ? (
                r.stories.map((s) => (
                  <Link
                    key={s.id}
                    to={`/stories/${s.id}`}
                    className={cn('rounded-md border px-2 py-0.5 text-xs hover:underline', CHIP[strength(s)])}
                  >
                    {s.title}
                    {scoreOf(s) !== undefined && <span className="ml-1 opacity-70">{scoreOf(s)}/10</span>}
                  </Link>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No story yet</span>
              )}
            </div>
            {!r.stories.some((s) => strength(s) === 'strong') && (
              <Button size="sm" variant="ghost" className="h-7 shrink-0 text-xs" onClick={() => onBuild(r.competency)}>
                <MessagesSquare className="size-3.5" />
                {r.stories.length ? 'Build a stronger one' : 'Build a story for this'}
              </Button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
