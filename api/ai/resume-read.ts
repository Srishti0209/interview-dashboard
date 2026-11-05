// POST /api/ai/resume-read { pdf: base64, text }
// Fixes characters the PDF reader couldn't map (shown as �) by having
// Claude read the original PDF. Runs before the resume is saved, so the PDF
// comes in the request rather than from storage.
import { authenticate } from '../_lib/auth.js';
import { fixtureMode, structured } from '../_lib/claude.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';
import { assertUnderCap, recordUsage } from '../_lib/usage.js';
import { plausibleFix, resumeReadPrompts } from '../../src/lib/storyAi/prompts.js';
import { resumeReadSchema, type ResumeReadResult } from '../../src/lib/storyAi/schemas.js';
import { validate } from '../../src/lib/storyAi/validate.js';

// Vercel limits request bodies to 4.5 MB; base64 adds a third.
const MAX_BASE64 = 4_000_000;

export const POST = handle(async (req) => {
  const { userId, admin } = await authenticate(req);
  const { pdf, text } = await readJson<{ pdf?: string; text?: string }>(req);
  if (!pdf || !text) throw new HttpError(400, 'bad_request', 'pdf and text are required.');
  if (pdf.length > MAX_BASE64) {
    throw new HttpError(413, 'bad_request', 'That PDF is too large to send. Use “Do it in Claude” instead.');
  }
  await assertUnderCap(admin, userId, 'read');

  if (fixtureMode()) {
    // Test mode: pretend every unreadable character was a "+".
    await recordUsage(admin, userId, 'resume:read', { input_tokens: 0, output_tokens: 0 });
    return json({ text: text.replaceAll('�', '+') });
  }

  const { value, usage } = await structured('read', {
    ...resumeReadPrompts(text.slice(0, 30000)),
    pdfs: [pdf],
    schema: resumeReadSchema,
    maxTokens: 12000,
  });
  await recordUsage(admin, userId, 'resume:read', usage);
  const checked = validate<ResumeReadResult>(resumeReadSchema, value);
  if (!checked.ok || !plausibleFix(text, checked.value.text)) {
    throw new HttpError(502, 'bad_output', 'Claude’s reply changed more than the unreadable characters, so it wasn’t used. Fix them by hand or try again.');
  }
  return json(checked.value);
});
