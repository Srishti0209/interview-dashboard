import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ListChecks, Loader2, MessagesSquare, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HandOffPanel } from '@/components/ai/HandOffPanel';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useJobs } from '@/hooks/useJobs';
import { useProfile } from '@/hooks/useProfile';
import { useAllQuestions, useReviewStates } from '@/hooks/useQuestions';
import { useStories } from '@/hooks/useStories';
import { ROUND_TYPES, roleTitle } from '@/lib/constants';
import { deleteJob } from '@/lib/jobs';
import { UNTITLED_STORY, createStory, emptyStory } from '@/lib/stories';
import { AiError, aiPost } from '@/lib/storyAi/client';
import { cleanJdReport, handOffPrompt, jdPrompts, type JdQuestion, type JdStory } from '@/lib/storyAi/prompts';
import { saveJdReport } from '@/lib/storyAi/save';
import { jdReportSchema, type JdReport } from '@/lib/storyAi/schemas';
import { cn } from '@/lib/utils';
import type { JobDescription } from '@/types';

const STRENGTH = {
  strong: { label: 'Strong', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' },
  partial: { label: 'Partial', className: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300' },
  missing: { label: 'Missing', className: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300' },
};

export default function JobDetail() {
  const { id } = useParams();
  const jobs = useJobs();
  const job = jobs?.find((j) => j.id === id);
  if (jobs === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!job) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm">
        Job not found. <Link className="underline" to="/jobs">Back to Jobs</Link>
      </div>
    );
  }
  return <Job job={job} />;
}

function Job({ job }: { job: JobDescription }) {
  const navigate = useNavigate();
  const stories = useStories();
  const questions = useAllQuestions();
  const reviews = useReviewStates();
  const profile = useProfile().data;
  const { status } = useAiStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [manual, setManual] = useState(false);
  const targetRole =
    profile?.targetRoleFamily && profile.targetLevel
      ? roleTitle(profile.targetRoleFamily, profile.targetLevel)
      : 'Software Engineer';

  const storyList: JdStory[] = (stories ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    bestFor: s.details?.bestFor ?? s.applicableTo,
    score: s.details?.score ?? s.details?.critique?.score,
    summary: (s.details?.short30 || [s.situation, s.action, s.result].filter(Boolean).join(' ')).slice(0, 400),
  }));
  const questionList: JdQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    round: q.roundType,
    title: q.title,
    practised: (reviews.get(q.id)?.reviewCount ?? 0) > 0 || !!q.personalAnswer?.trim(),
  }));
  const jd = { company: job.company, title: job.title, text: job.rawText, values: job.companyValues };
  const ready = stories !== undefined && questions !== undefined;

  const save = (report: JdReport) =>
    saveJdReport(
      job,
      cleanJdReport(report, {
        storyIds: storyList.map((s) => s.id),
        questionIds: questionList.map((q) => q.id),
        roundTypes: ROUND_TYPES,
      }),
      (questions ?? []).map((q) => q.title),
    );

  const analyse = async () => {
    setBusy(true);
    setError(null);
    try {
      await save(
        await aiPost<JdReport>('jd-gaps', { jd, stories: storyList, questions: questionList, roundTypes: ROUND_TYPES, targetRole }),
      );
    } catch (e) {
      setError(e instanceof AiError ? e : new AiError('server_error', 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  // A story aimed at a value this job assesses.
  const buildFor = async (value: string) => {
    const id = await createStory({ ...emptyStory, title: UNTITLED_STORY, source: 'user', isDraft: true });
    navigate(`/stories/${id}/build?for=${encodeURIComponent(value)}`);
  };

  const remove = async () => {
    if (!confirm('Delete this job? Questions it added stay in your bank.')) return;
    await deleteJob(job.id);
    navigate('/jobs');
  };

  const handOff = manual || (status && !status.enabled) || error?.handOff;
  const storyTitle = (id: string) => stories?.find((s) => s.id === id)?.title;
  const gaps = job.gaps;
  const p = job.parsed;
  const newQuestions = (questions ?? []).filter((q) => gaps?.newQuestionIds.includes(q.id));

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6" data-testid="job-detail">
      <Link to="/jobs" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Jobs
      </Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{job.title || 'Untitled role'}</h1>
          <p className="text-sm text-muted-foreground">{job.company || 'Company not set'}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={remove}>
          <Trash2 className="size-4 text-destructive" /> Delete
        </Button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <details>
            <summary className="cursor-pointer text-sm font-semibold">Job description{job.fileName ? ` (${job.fileName})` : ''}</summary>
            <p className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{job.rawText}</p>
          </details>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold">Company values</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
            {job.companyValues || 'Not added. The analysis will infer them from the job description.'}
          </p>
        </Card>
      </div>

      {/* Analyse */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Gap analysis</p>
            <p className="text-xs text-muted-foreground">
              {gaps
                ? `Analysed ${formatDistanceToNow(gaps.analysedAt, { addSuffix: true })}. Re-run after adding stories or practising.`
                : `Compares this job with your ${storyList.length} stories and ${questionList.length} questions.`}
              {status?.fixture && ' Test mode: sample report, no AI call.'}
            </p>
          </div>
          {!handOff && (
            <Button size="sm" onClick={analyse} disabled={busy || !ready}>
              {busy ? <Loader2 className="animate-spin" /> : gaps ? <RefreshCw /> : <Sparkles />}
              {gaps ? 'Analyse again' : 'Analyse gaps'}
            </Button>
          )}
        </div>
        {error && !handOff && <p className="mt-2 text-xs text-destructive">{error.message}</p>}
        {!handOff && (
          <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => setManual(true)}>
            Do it in Claude instead
          </Button>
        )}
        {handOff && ready && (
          <div className="mt-3">
            <HandOffPanel<JdReport>
              reason={error?.message}
              prompt={handOffPrompt(jdPrompts(jd, storyList, questionList, ROUND_TYPES, targetRole), jdReportSchema)}
              schema={jdReportSchema}
              importLabel="Import analysis"
              onImport={async (r) => {
                await save(r);
                setManual(false);
                setError(null);
              }}
            />
          </div>
        )}
      </Card>

      {p && gaps && (
        <div className="space-y-4" data-testid="jd-report">
          <Card className="space-y-2 p-4 text-sm">
            <h2 className="font-semibold">What they’re looking for</h2>
            {p.seniority && <p><span className="text-muted-foreground">Seniority: </span>{p.seniority}</p>}
            <Chips label="Skills" items={p.skills} />
            <Chips label="Focus areas" items={p.focusAreas} />
            <Chips label="Likely rounds" items={p.likelyRounds} />
            <Chips label="Values" items={p.values} />
          </Card>

          <Card className="p-4" data-testid="story-gaps">
            <h2 className="mb-2 text-sm font-semibold">Your stories against their values</h2>
            <ul className="divide-y">
              {gaps.storyGaps.map((g) => (
                <li key={g.value} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                  <div className="w-48 shrink-0">
                    <p className="text-sm font-medium">{g.value}</p>
                    <Badge variant="outline" className={cn('mt-1 font-normal', STRENGTH[g.strength].className)}>
                      {STRENGTH[g.strength].label}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    {g.storyId && storyTitle(g.storyId) && (
                      <Link to={`/stories/${g.storyId}`} className="font-medium hover:underline">
                        {storyTitle(g.storyId)}
                      </Link>
                    )}
                    <p className="text-muted-foreground">{g.advice}</p>
                    {(g.otherStoryIds ?? []).some(storyTitle) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Also fits:{' '}
                        {(g.otherStoryIds ?? []).filter(storyTitle).map((id, i) => (
                          <span key={id}>
                            {i > 0 && ', '}
                            <Link to={`/stories/${id}`} className="text-foreground hover:underline">
                              {storyTitle(id)}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    {!!g.likelyQuestions?.length && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                        {g.likelyQuestions.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {g.strength !== 'strong' && (
                    <Button size="sm" variant="ghost" className="h-7 shrink-0 text-xs" onClick={() => void buildFor(g.value)}>
                      <MessagesSquare className="size-3.5" /> Build this story
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {!!gaps.roundPrep?.length && (
            <Card className="p-4" data-testid="round-prep">
              <h2 className="mb-2 text-sm font-semibold">Types of questions to prepare</h2>
              <ul className="divide-y">
                {gaps.roundPrep.map((r) => (
                  <li key={r.round} className="space-y-1.5 py-3 text-sm">
                    <p className="font-medium">{r.round}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.questionTypes.map((t) => (
                        <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
                      ))}
                    </div>
                    {r.examples.length > 0 && (
                      <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                        {r.examples.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-4" data-testid="question-gaps">
            <h2 className="mb-2 text-sm font-semibold">Topics to practise</h2>
            <ul className="divide-y">
              {gaps.questionGaps.map((g) => (
                <li key={g.topic} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{g.topic}</p>
                    <p className="text-muted-foreground">{g.reason}</p>
                  </div>
                  {g.questionIds.length > 0 && (
                    <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" asChild>
                      <Link to={`/questions?ids=${g.questionIds.join(',')}&label=${encodeURIComponent(`${g.topic} (${job.company || job.title})`)}`}>
                        <ListChecks className="size-3.5" /> Practise these ({g.questionIds.length})
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {newQuestions.length > 0 && (
            <Card className="p-4" data-testid="new-questions">
              <h2 className="mb-1 text-sm font-semibold">Added to your question bank for this job</h2>
              <ul className="list-disc space-y-0.5 pl-5 text-sm">
                {newQuestions.map((q) => (
                  <li key={q.id}>
                    <Link to={`/questions/${q.id}`} className="hover:underline">{q.title}</Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      {items.map((i) => (
        <Badge key={i} variant="outline" className="font-normal">{i}</Badge>
      ))}
    </div>
  );
}
