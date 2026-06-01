import { db } from '@/lib/db';
import { uid } from '@/lib/utils';
import type { Story } from '@/types';

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
  await db.stories.put({ id, ...input });
  return id;
}

export async function updateStory(
  id: string,
  patch: Partial<Story>,
): Promise<void> {
  await db.stories.update(id, patch);
}

export async function deleteStory(id: string): Promise<void> {
  await db.stories.delete(id);
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
