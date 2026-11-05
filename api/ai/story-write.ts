// POST /api/ai/story-write { seed, targetRole, turns } → the story in the rich
// format (writeUpSchema), from the Story Builder interview.
import { authenticate } from '../_lib/auth.js';
import { structured } from '../_lib/claude.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';
import { readSeed, readTurns } from '../_lib/story.js';
import { assertUnderCap, recordUsage } from '../_lib/usage.js';
import { writeUpPrompts } from '../../src/lib/storyAi/prompts.js';
import { writeUpSchema } from '../../src/lib/storyAi/schemas.js';
import { validate } from '../../src/lib/storyAi/validate.js';

export const POST = handle(async (req) => {
  const { userId, admin } = await authenticate(req);
  const body = await readJson<Record<string, unknown>>(req);
  const turns = readTurns(body.turns);
  if (!turns.some((t) => t.role === 'user')) {
    throw new HttpError(400, 'bad_request', 'Answer at least one question before writing up the story.');
  }
  await assertUnderCap(admin, userId, 'write');

  const { value, usage } = await structured('write', {
    ...writeUpPrompts(readSeed(body.seed), String(body.targetRole ?? 'Software Engineer').slice(0, 100), turns),
    schema: writeUpSchema,
    maxTokens: 16000,
  });
  await recordUsage(admin, userId, 'story:write', usage);
  const checked = validate(writeUpSchema, value);
  if (!checked.ok) throw new HttpError(502, 'bad_output', 'Claude returned an unexpected reply. Try again.');
  return json(checked.value);
});
