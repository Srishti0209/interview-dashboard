// POST /api/ai/jd-gaps { jd, stories, questions, roundTypes, targetRole }
// → JdReport: what the job needs, and the gaps in the story and question bank.
import { authenticate } from '../_lib/auth.js';
import { fixtureMode, structured } from '../_lib/claude.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';
import { assertUnderCap, recordUsage } from '../_lib/usage.js';
import { cleanJdReport, jdPrompts, type JdQuestion, type JdStory } from '../../src/lib/storyAi/prompts.js';
import { jdReportSchema, type JdReport } from '../../src/lib/storyAi/schemas.js';
import { validate } from '../../src/lib/storyAi/validate.js';

const text = (v: unknown, max: number) => String(v ?? '').slice(0, max);
const list = (v: unknown, n: number): Record<string, unknown>[] => (Array.isArray(v) ? v.slice(0, n) : []);

export const POST = handle(async (req) => {
  const { userId, admin } = await authenticate(req);
  const body = await readJson<Record<string, unknown>>(req);
  const jd = (body.jd ?? {}) as Record<string, unknown>;
  const jdText = text(jd.text, 20000);
  if (jdText.trim().length < 100) {
    throw new HttpError(400, 'bad_request', 'Add the job description text first (at least a few lines).');
  }
  const stories: JdStory[] = list(body.stories, 60).map((st) => ({
    id: text(st.id, 80),
    title: text(st.title, 200),
    bestFor: list(st.bestFor, 8).map((b) => text(b, 60)),
    score: typeof st.score === 'number' ? st.score : undefined,
    summary: text(st.summary, 400),
  }));
  const questions: JdQuestion[] = list(body.questions, 500).map((q) => ({
    id: text(q.id, 80),
    round: text(q.round, 60),
    title: text(q.title, 200),
    practised: !!q.practised,
  }));
  const roundTypes = list(body.roundTypes, 60).map((r) => text(r, 60));
  await assertUnderCap(admin, userId, 'jd');

  const { value, usage } = await structured('jd', {
    ...jdPrompts(
      { company: text(jd.company, 120), title: text(jd.title, 120), text: jdText, values: text(jd.values, 4000) },
      stories,
      questions,
      roundTypes,
      text(body.targetRole, 100) || 'Software Engineer',
    ),
    schema: jdReportSchema,
    maxTokens: 16000,
  });
  await recordUsage(admin, userId, 'jd:gaps', usage);
  const checked = validate<JdReport>(jdReportSchema, value);
  if (!checked.ok) throw new HttpError(502, 'bad_output', 'Claude returned an unexpected reply. Try again.');
  const report = checked.value;

  if (fixtureMode()) {
    // Test mode: point the canned report at the user's real items.
    report.storyGaps[0].storyId = stories[0]?.id ?? '';
    report.storyGaps[0].otherStoryIds = stories.slice(1, 3).map((st) => st.id);
    report.questionGaps[0].questionIds = questions.slice(0, 3).map((q) => q.id);
  }
  // Only link to stories and questions the user actually has.
  return json(
    cleanJdReport(report, {
      storyIds: stories.map((st) => st.id),
      questionIds: questions.map((q) => q.id),
      roundTypes,
    }),
  );
});
