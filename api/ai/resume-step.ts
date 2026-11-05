// POST /api/ai/resume-step { resumeId, step, targetRole, currentPosition, storyTitles? }
// One short step of the quick-drafts run: parse → drafts → questions. The
// client saves each result itself (same code as the hand-off path).
import { authenticate } from '../_lib/auth.js';
import { structured } from '../_lib/claude.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';
import { assertUnderCap, recordUsage } from '../_lib/usage.js';
import { resumePrompts } from '../../src/lib/storyAi/prompts.js';
import {
  draftsSchema,
  questionsSchema,
  resumeParsedSchema,
} from '../../src/lib/storyAi/schemas.js';
import { validate } from '../../src/lib/storyAi/validate.js';

const STEPS = {
  parse: { schema: resumeParsedSchema, maxTokens: 6000 },
  drafts: { schema: draftsSchema, maxTokens: 12000 },
  questions: { schema: questionsSchema, maxTokens: 12000 },
} as const;
type Step = keyof typeof STEPS;

interface Body {
  resumeId?: string;
  step?: string;
  targetRole?: string;
  currentPosition?: string;
  storyTitles?: string[];
}

export const POST = handle(async (req) => {
  const { userId, db, admin } = await authenticate(req);
  const body = await readJson<Body>(req);
  const step = body.step as Step;
  if (!body.resumeId || !(step in STEPS)) {
    throw new HttpError(400, 'bad_request', 'resumeId and a valid step are required.');
  }

  const endpoint = `resume:${step}`;
  await assertUnderCap(admin, userId, 'resume', endpoint);

  // Read as the user: row-level security only returns their own resume.
  const { data: resume } = await db
    .from('resumes')
    .select('extracted_text')
    .eq('id', body.resumeId)
    .maybeSingle();
  if (!resume) throw new HttpError(404, 'not_found', 'Resume not found.');

  const prompts = resumePrompts(
    resume.extracted_text,
    {
      targetRole: String(body.targetRole ?? '').slice(0, 100),
      currentPosition: String(body.currentPosition ?? '').slice(0, 100),
    },
    (body.storyTitles ?? []).slice(0, 12).map((t) => String(t).slice(0, 120)),
  );
  const { schema, maxTokens } = STEPS[step];
  const { value, usage } = await structured(step, { ...prompts[step], schema, maxTokens });
  await recordUsage(admin, userId, endpoint, usage);

  const checked = validate(schema, value);
  if (!checked.ok) {
    throw new HttpError(502, 'bad_output', 'Claude returned an unexpected reply. Try again.');
  }
  return json(checked.value);
});
