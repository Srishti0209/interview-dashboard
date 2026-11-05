// Saves AI results into the user's account. The API path and the "Do it in
// Claude" hand-off both end here, so their results are identical.
import { queryClient } from '@/lib/queryClient';
import { createQuestions } from '@/lib/questions';
import { createStories, updateStory } from '@/lib/stories';
import { enqueue } from '@/lib/sync';
import { updateJob } from '@/lib/jobs';
import type { JobDescription, Resume, RoundType, Story, StoryBuilderState } from '@/types';
import type { CritiqueInput, StorySeed } from './prompts';
import type {
  CritiqueResult,
  DraftStory,
  JdReport,
  QuickDraftsResult,
  ResumeParsed,
  ResumeQuestion,
  StoryWriteUp,
} from './schemas';

export async function saveResumeParsed(resumeId: string, parsed: ResumeParsed): Promise<void> {
  queryClient.setQueryData<Resume>(['resume', resumeId], (r) =>
    r ? { ...r, parsed: parsed as unknown as Record<string, unknown> } : r,
  );
  await enqueue({ type: 'update', table: 'resumes', match: { id: resumeId }, patch: { parsed } });
}

/** Adds AI draft stories; existing stories are never touched. */
export function saveDraftStories(resumeId: string | null, drafts: DraftStory[]): string[] {
  return createStories(
    drafts.map((d) => ({
      title: d.title,
      situation: d.situation,
      task: d.task,
      action: d.action,
      result: d.result,
      metrics: d.metrics,
      applicableTo: d.bestFor,
      tags: d.tags,
      source: 'ai',
      isDraft: true,
      resumeId,
      details: { bestFor: d.bestFor, gaps: d.gaps },
    })),
  );
}

/** Adds resume-based behavioural questions to the user's own bank. */
export function saveResumeQuestions(questions: ResumeQuestion[]): string[] {
  return createQuestions(
    questions.map((q) => ({
      title: q.title,
      body: q.body,
      answer: q.answer,
      roundType: 'BEHAVIORAL_BAR_RAISER',
      difficulty: 'medium',
      company: [],
      tags: [...new Set(['resume', ...q.tags.map((t) => t.toLowerCase())])],
    })),
    'ai',
  );
}

/** The hand-off returns all three quick-draft steps at once. */
export async function saveQuickDrafts(resumeId: string, result: QuickDraftsResult) {
  await saveResumeParsed(resumeId, result.parsed);
  const stories = saveDraftStories(resumeId, result.stories);
  const questions = saveResumeQuestions(result.questions);
  return { stories: stories.length, questions: questions.length };
}

// ---------------------------------------------------------------------------
// Story Builder
// ---------------------------------------------------------------------------

/** What the builder sends the coach about a story. */
export function storySeed(story: Story, competency?: string): StorySeed {
  return {
    title: story.title,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    metrics: story.metrics,
    gaps: story.details?.gaps ?? [],
    competency: competency ?? story.details?.builder?.seed,
  };
}

/** Saves the interview so far, so the session can be resumed. */
export function saveBuilderState(story: Story, builder: StoryBuilderState): Promise<void> {
  return updateStory(story.id, { details: { ...story.details, builder } });
}

/**
 * Applies a write-up to the story: the rich format goes in `details`, and the
 * plain S/T/A/R fields stay filled (matcher, backups, the edit dialog).
 */
export function saveWriteUp(story: Story, w: StoryWriteUp): Promise<void> {
  return updateStory(story.id, {
    title: w.title || story.title,
    situation: w.situation,
    task: w.task,
    action: w.beats.map((b) => `${b.name}: ${b.text}`).join('\n'),
    result: w.result,
    metrics: w.metrics,
    applicableTo: w.bestFor,
    tags: [...new Set([...story.tags, ...w.tags.map((t) => t.toLowerCase())])],
    isDraft: false,
    details: {
      ...story.details,
      score: w.score,
      bestFor: w.bestFor,
      beats: w.beats,
      reflection: w.reflection,
      deepDive: w.deepDive,
      people: w.people,
      whatWentWrong: w.whatWentWrong,
      short30: w.short30,
      long2min: w.long2min,
      gaps: w.gaps,
    },
  });
}

// ---------------------------------------------------------------------------
// Story critic
// ---------------------------------------------------------------------------

/** What the critic sees of a story. */
export function critiqueInput(story: Story): CritiqueInput {
  const d = story.details ?? {};
  return {
    title: story.title,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    metrics: story.metrics,
    reflection: d.reflection,
    beats: d.beats,
    deepDive: d.deepDive,
  };
}

export function saveCritique(story: Story, c: CritiqueResult): Promise<void> {
  return updateStory(story.id, {
    details: { ...story.details, critique: { ...c, createdAt: Date.now() } },
  });
}

// ---------------------------------------------------------------------------
// JD gap analysis
// ---------------------------------------------------------------------------

/**
 * Saves a gap report on the job, and adds its suggested questions to the
 * user's bank (skipping ones whose title they already have).
 */
export async function saveJdReport(job: JobDescription, report: JdReport, existingTitles: string[]): Promise<void> {
  const have = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const slug = job.company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fresh = report.newQuestions.filter((q) => !have.has(q.title.trim().toLowerCase()));
  const newIds = createQuestions(
    fresh.map((q) => ({
      title: q.title,
      body: q.body,
      answer: q.answer,
      roundType: q.roundType as RoundType,
      difficulty: 'medium',
      company: job.company.trim() ? [job.company.trim()] : [],
      tags: [...new Set(['jd', ...(slug ? [`jd:${slug}`] : []), ...q.tags.map((t) => t.toLowerCase())])],
    })),
    'ai',
  );
  await updateJob(job.id, {
    parsed: report.parsed,
    gaps: {
      storyGaps: report.storyGaps,
      questionGaps: report.questionGaps,
      roundPrep: report.roundPrep,
      newQuestionIds: [...(job.gaps?.newQuestionIds ?? []), ...newIds],
      analysedAt: Date.now(),
    },
  });
}
