// POST /api/ai/story-chat { seed, targetRole, stage, turns } → streamed text.
// One coach turn of the Story Builder interview. The reply ends with a
// <stage>N</stage> marker the client strips.
import { authenticate } from '../_lib/auth.js';
import { streamChat } from '../_lib/claude.js';
import { HttpError, handle, readJson } from '../_lib/http.js';
import { readSeed, readTurns } from '../_lib/story.js';
import { assertUnderCap, recordUsage } from '../_lib/usage.js';
import { coachPrompt } from '../../src/lib/storyAi/prompts.js';
import { STAGES } from '../../src/lib/storyAi/stages.js';

export const POST = handle(async (req) => {
  const { userId, admin } = await authenticate(req);
  const body = await readJson<Record<string, unknown>>(req);
  const turns = readTurns(body.turns);
  if (turns.at(-1)?.role !== 'user') {
    throw new HttpError(400, 'bad_request', 'The last turn must be the candidate’s answer.');
  }
  const stage = Math.min(STAGES.length, Math.max(1, Math.round(Number(body.stage) || 1)));
  await assertUnderCap(admin, userId, 'chat');

  const { system, messages } = coachPrompt(
    readSeed(body.seed),
    String(body.targetRole ?? 'Software Engineer').slice(0, 100),
    turns,
    stage,
  );
  // Test mode: acknowledge and move to the next stage's question.
  const next = Math.min(STAGES.length, stage + 1);
  const stream = streamChat(
    'chat',
    { system, messages, maxTokens: 1500 },
    {
      fixtureReply: `Thanks, that helps. ${STAGES[next - 1].ask} <stage>${next}</stage>`,
      onDone: (usage) => recordUsage(admin, userId, 'story:chat', usage),
    },
  );
  return new Response(stream, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
});
