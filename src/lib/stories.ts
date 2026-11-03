import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { enqueue, waitForPendingWrites } from '@/lib/sync';
import { uid } from '@/lib/utils';
import type { Story } from '@/types';

export const STORIES_KEY = ['stories'] as const;

interface StoryRow {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  applicable_to: string[];
  tags: string[];
  created_at: number;
}

const STORY_COLUMNS =
  'id, title, situation, task, action, result, metrics, applicable_to, tags, created_at';

export async function fetchStories(): Promise<Story[]> {
  await waitForPendingWrites();
  const rows = await fetchAll<StoryRow>('stories', STORY_COLUMNS, 'id');
  return rows
    .sort((a, b) => Number(a.created_at) - Number(b.created_at))
    .map((r) => ({
      id: r.id,
      title: r.title,
      situation: r.situation,
      task: r.task,
      action: r.action,
      result: r.result,
      metrics: r.metrics,
      applicableTo: r.applicable_to,
      tags: r.tags,
    }));
}

function setStories(fn: (stories: Story[]) => Story[]) {
  queryClient.setQueryData<Story[]>(STORIES_KEY, (s) => (s ? fn(s) : s));
}

function toRow(story: Partial<Story>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('title' in story) row.title = story.title;
  if ('situation' in story) row.situation = story.situation;
  if ('task' in story) row.task = story.task;
  if ('action' in story) row.action = story.action;
  if ('result' in story) row.result = story.result;
  if ('metrics' in story) row.metrics = story.metrics;
  if ('applicableTo' in story) row.applicable_to = story.applicableTo;
  if ('tags' in story) row.tags = story.tags;
  return row;
}

export type StoryInput = Omit<Story, 'id'>;

export const emptyStory: StoryInput = {
  title: '',
  situation: '',
  task: '',
  action: '',
  result: '',
  metrics: '',
  applicableTo: [],
  tags: [],
};

export async function createStory(input: StoryInput): Promise<string> {
  const id = uid();
  const now = Date.now();
  setStories((s) => [...s, { id, ...input }]);
  void enqueue({
    type: 'upsert',
    table: 'stories',
    rows: [{ id, ...toRow(input), created_at: now, updated_at: now }],
    onConflict: 'id',
  });
  return id;
}

export async function updateStory(
  id: string,
  patch: Partial<Story>,
): Promise<void> {
  setStories((stories) =>
    stories.map((s) => (s.id === id ? { ...s, ...patch, id } : s)),
  );
  void enqueue({
    type: 'update',
    table: 'stories',
    match: { id },
    patch: { ...toRow(patch), updated_at: Date.now() },
  });
}

export async function deleteStory(id: string): Promise<void> {
  setStories((stories) => stories.filter((s) => s.id !== id));
  void enqueue({ type: 'delete', table: 'stories', match: { id } });
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with',
  'about', 'tell', 'me', 'describe', 'give', 'time', 'when', 'you', 'your',
  'how', 'did', 'do', 'was', 'were', 'is', 'are', 'that', 'this', 'have',
  'had', 'has', 'i', 'we', 'my', 'our', 'it', 'at', 'as', 'by', 'be',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export interface StoryMatch {
  story: Story;
  score: number;
  matched: string[];
}

/**
 * Matches a behavioral question against the story bank by overlap of the
 * question's keywords with each story's tags + applicableTo + content words.
 */
export function matchStories(question: string, stories: Story[]): StoryMatch[] {
  const qWords = new Set(tokenize(question));
  if (qWords.size === 0) return [];

  return stories
    .map((story) => {
      const haystack = [
        ...story.tags,
        ...story.applicableTo,
        story.title,
      ]
        .join(' ')
        .toLowerCase();
      const tagWords = new Set([
        ...story.tags.map((t) => t.toLowerCase()),
        ...story.applicableTo.map((t) => t.toLowerCase()),
      ]);

      const matched: string[] = [];
      let score = 0;
      for (const w of qWords) {
        // strong signal: exact tag/applicableTo match
        if (tagWords.has(w)) {
          score += 3;
          matched.push(w);
        } else if (haystack.includes(w)) {
          score += 1;
          matched.push(w);
        }
      }
      return { story, score, matched };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}
