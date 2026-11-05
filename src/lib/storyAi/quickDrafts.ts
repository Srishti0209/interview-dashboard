// Runs the quick-drafts steps (parse → drafts → questions) through the API.
// State lives in a module-level store, so a run keeps going while the user
// moves around the app. Steps whose output already exists are skipped, which
// makes a run resumable after a reload and lets a failed step be retried
// alone.
import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import { QUESTIONS_KEY, fetchQuestionData } from '@/lib/questions';
import { getResume } from '@/lib/resume';
import { STORIES_KEY, fetchStories } from '@/lib/stories';
import { AiError, aiPost } from './client';
import type { Candidate } from './prompts';
import { saveDraftStories, saveResumeParsed, saveResumeQuestions } from './save';
import type { DraftsResult, QuestionsResult, ResumeParsed } from './schemas';

export const QUICK_STEPS = ['parse', 'drafts', 'questions'] as const;
export type QuickStep = (typeof QUICK_STEPS)[number];

export const QUICK_STEP_LABEL: Record<QuickStep, string> = {
  parse: 'Reading your resume',
  drafts: 'Drafting stories',
  questions: 'Writing resume questions',
};

export interface QuickRun {
  status: 'running' | 'done' | 'error';
  step: QuickStep;
  error?: AiError;
  counts?: { stories: number; questions: number };
}

interface Store {
  runs: Record<string, QuickRun>;
  set: (resumeId: string, run: QuickRun) => void;
}

export const useQuickDraftsStore = create<Store>((set) => ({
  runs: {},
  set: (resumeId, run) => set((s) => ({ runs: { ...s.runs, [resumeId]: run } })),
}));

/**
 * Which steps already have saved output for this resume. Returns an array
 * (not a Set) because query results are persisted to IndexedDB as JSON.
 */
export async function completedSteps(resumeId: string): Promise<QuickStep[]> {
  const [resume, stories, questionData] = await Promise.all([
    queryClient.fetchQuery({ queryKey: ['resume', resumeId], queryFn: () => getResume(resumeId) }),
    queryClient.fetchQuery({ queryKey: STORIES_KEY, queryFn: fetchStories }),
    queryClient.fetchQuery({ queryKey: QUESTIONS_KEY, queryFn: fetchQuestionData }),
  ]);
  const done = new Set<QuickStep>();
  if (resume.parsed) done.add('parse');
  if (stories.some((s) => s.resumeId === resumeId && s.source === 'ai')) done.add('drafts');
  const since = Date.parse(resume.createdAt);
  if (
    questionData.questions.some(
      (q) => q.source === 'ai' && q.tags.includes('resume') && q.createdAt >= since,
    )
  ) {
    done.add('questions');
  }
  return [...done];
}

export async function runQuickDrafts(resumeId: string, who: Candidate): Promise<void> {
  const { set, runs } = useQuickDraftsStore.getState();
  if (runs[resumeId]?.status === 'running') return;

  let step: QuickStep = 'parse';
  const counts = { stories: 0, questions: 0 };
  set(resumeId, { status: 'running', step });
  try {
    const done = await completedSteps(resumeId);
    for (step of QUICK_STEPS) {
      if (done.includes(step)) continue;
      set(resumeId, { status: 'running', step });
      const base = { resumeId, step, ...who };
      if (step === 'parse') {
        await saveResumeParsed(resumeId, await aiPost<ResumeParsed>('resume-step', base));
      } else if (step === 'drafts') {
        const { stories } = await aiPost<DraftsResult>('resume-step', base);
        counts.stories = saveDraftStories(resumeId, stories).length;
      } else {
        const titles = (queryClient.getQueryData<{ resumeId?: string | null; title: string }[]>(STORIES_KEY) ?? [])
          .filter((s) => s.resumeId === resumeId)
          .map((s) => s.title);
        const { questions } = await aiPost<QuestionsResult>('resume-step', { ...base, storyTitles: titles });
        counts.questions = saveResumeQuestions(questions).length;
      }
    }
    set(resumeId, { status: 'done', step: 'questions', counts });
    void queryClient.invalidateQueries({ queryKey: ['ai-status'] });
  } catch (e) {
    const error = e instanceof AiError ? e : new AiError('server_error', 'Something went wrong. Try again.');
    set(resumeId, { status: 'error', step, error });
  }
}
