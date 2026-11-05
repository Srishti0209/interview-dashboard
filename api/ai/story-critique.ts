// POST /api/ai/story-critique { story, targetRole } → scores per dimension,
// what to add, and the Story Builder stage that would fix the biggest gap.
import { authenticate } from '../_lib/auth.js';
import { structured } from '../_lib/claude.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';
import { assertUnderCap, recordUsage } from '../_lib/usage.js';
import { critiquePrompts, type CritiqueInput } from '../../src/lib/storyAi/prompts.js';
import { critiqueSchema } from '../../src/lib/storyAi/schemas.js';
import { validate } from '../../src/lib/storyAi/validate.js';

const text = (v: unknown, max = 4000) => String(v ?? '').slice(0, max);

function readStory(v: unknown): CritiqueInput {
  const s = (v ?? {}) as Record<string, unknown>;
  const list = (x: unknown, n: number) => (Array.isArray(x) ? x.slice(0, n) : []);
  return {
    title: text(s.title, 200),
    situation: text(s.situation),
    task: text(s.task),
    action: text(s.action, 6000),
    result: text(s.result),
    metrics: text(s.metrics, 1000),
    reflection: text(s.reflection),
    beats: list(s.beats, 4).map((b) => ({ name: text((b as { name?: string }).name, 120), text: text((b as { text?: string }).text) })),
    deepDive: list(s.deepDive, 10).map((q) => ({
      question: text((q as { question?: string }).question, 400),
      answer: text((q as { answer?: string }).answer, 2000),
    })),
  };
}

export const POST = handle(async (req) => {
  const { userId, admin } = await authenticate(req);
  const body = await readJson<Record<string, unknown>>(req);
  const story = readStory(body.story);
  if (!(story.situation + story.task + story.action + story.result).trim()) {
    throw new HttpError(400, 'bad_request', 'Add some of the story before asking for feedback.');
  }
  await assertUnderCap(admin, userId, 'critique');
  const { value, usage } = await structured('critique', {
    ...critiquePrompts(story, text(body.targetRole, 100) || 'Software Engineer'),
    schema: critiqueSchema,
    maxTokens: 8000,
  });
  await recordUsage(admin, userId, 'story:critique', usage);
  const checked = validate(critiqueSchema, value);
  if (!checked.ok) throw new HttpError(502, 'bad_output', 'Claude returned an unexpected reply. Try again.');
  return json(checked.value);
});
