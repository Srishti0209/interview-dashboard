// Phase 6 story bank AI (dev server in AI_FIXTURE=1 mode, so no API calls):
//  1. empty Story Bank offers "Start from your resume" and "Write a story"
//  2. hand-off: paste resume → copy prompt → bad reply rejected → good reply
//     imports drafts (badges + gaps) and resume questions; Keep clears a draft
//  3. automatic: Generate runs parse → drafts → questions and saves results
//  4. resumable: a run missing its last step offers "Continue generating" and
//     only calls that step
//  5. daily cap reached → hand-off offered; the API refuses with cap_reached
//  6. API rejects a bad step and an unknown resume
//  7. Account: a new resume offers to draft stories
//  8. PDF with unmapped glyphs: "7+" repaired automatically; the rest shown
//     as � with a warning, fixed by "Fix with Claude"; endpoint guards
import { chromium } from 'playwright';
import { newSignedInContext, getSmokeSession, rest, eventually, url } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];

function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

// ai_usage is written only by the server, so tests manage it with the service role.
async function admin(path, init = {}) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: k, Authorization: `Bearer ${k}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const RESUME = Array.from(
  { length: 10 },
  (_, i) => `Line ${i + 1}: Senior engineer at Shopwise. Led the checkout rewrite across 4 brands and cut p95 load from 3.1s to 1.4s.`,
).join('\n');

// A valid hand-off reply (same shape as quickDraftsSchema), wrapped in prose.
const REPLY = {
  parsed: { roles: [{ company: 'Shopwise', title: 'Senior Engineer', start: '2021', end: 'present', highlights: ['Checkout rewrite'] }], skills: ['React'], projects: ['Checkout rewrite'], metrics: ['4 brands'] },
  stories: [
    { title: 'HANDOFF story one', situation: 's', task: 't', action: 'a', result: 'r', metrics: '4 brands', bestFor: ['Ownership'], tags: ['migration'], gaps: ['How much revenue was at stake?'] },
    { title: 'HANDOFF story two', situation: 's', task: 't', action: 'a', result: 'r', metrics: '', bestFor: ['Conflict'], tags: [], gaps: [] },
  ],
  questions: [{ title: 'HANDOFF question: walk me through your career', body: 'b', answer: '- point', tags: ['career'] }],
};

// A PDF whose ToUnicode map sends 0x80/0x82 to U+0000 (no character).
function unmappedPdf(lines) {
  const cmap = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CMapName /T def 1 begincodespacerange <00> <FF> endcodespacerange 1 beginbfrange <20> <7E> <0020> endbfrange 2 beginbfchar <80> <0000> <82> <0000> endbfchar endcmap CMapName currentdict /CMap defineresource pop end end';
  const content = 'BT /F1 10 Tf 72 740 Td 14 TL ' + lines.map((l) => `(${l}) Tj T*`).join(' ') + ' ET';
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/ToUnicode 6 0 R>>',
    `<</Length ${cmap.length}>>\nstream\n${cmap}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

const { user, access_token } = await getSmokeSession();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser);
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));

async function clearAi() {
  await rest(`stories?user_id=eq.${user.id}`, { method: 'DELETE' });
  await rest(`questions?owner_id=eq.${user.id}`, { method: 'DELETE' });
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
}
const usage = () => admin(`ai_usage?user_id=eq.${user.id}&select=endpoint`);
const aiStories = () => rest('stories?select=id,title,source,is_draft,resume_id,details&source=eq.ai');
const aiQuestions = () => rest(`questions?select=id,title,tags,source&owner_id=eq.${user.id}&source=eq.ai`);

try {
  await clearAi();
  await rest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ active_resume_id: null }) });

  // 1. Empty state
  await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="stories-empty"]');
  log(await page.isVisible('text=Start from your resume'), 'empty Story Bank offers "Start from your resume"');
  log(await page.isVisible('text=Write a story yourself'), 'empty Story Bank offers "Write a story yourself"');

  // 2. Hand-off path
  await page.click('button:has-text("Paste resume text instead")');
  await page.fill('textarea[aria-label="Resume text"]', RESUME);
  await page.click('button:has-text("Save resume")');
  await page.waitForSelector('button:has-text("Generate draft stories and questions")');
  log(await page.isVisible('text=Test mode'), 'fixture mode is shown (no AI call)');
  await page.click('button:has-text("Do it in Claude instead")');
  await page.waitForSelector('[data-testid="handoff-panel"]');
  await page.click('button:has-text("Copy prompt")');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  log(copied.includes('Led the checkout rewrite') && copied.includes('"stories"'), 'copied prompt contains the resume and the JSON shape');

  await page.fill('textarea[aria-label="Claude’s reply"]', 'Sure, what would you like me to do?');
  await page.click('button:has-text("Import stories and questions")');
  log(await page.isVisible('text=No JSON object found'), 'a reply without JSON is rejected with a clear message');

  const broken = structuredClone(REPLY);
  delete broken.stories[0].title;
  await page.fill('textarea[aria-label="Claude’s reply"]', JSON.stringify(broken));
  await page.click('button:has-text("Import stories and questions")');
  log(await page.isVisible('text=stories[0].title is missing'), 'a reply with a missing field names the field');

  await page.fill('textarea[aria-label="Claude’s reply"]', 'Here you go:\n```json\n' + JSON.stringify(REPLY) + '\n```');
  await page.click('button:has-text("Import stories and questions")');
  await page.waitForSelector('text=Added 2 draft stories and 1 resume question');
  log(true, 'valid reply imported: 2 stories, 1 question');

  await page.waitForSelector('text=HANDOFF story one');
  log((await page.locator('text=AI draft').count()) === 2, 'imported stories show the "AI draft" badge');
  log(await page.isVisible('text=How much revenue was at stake?'), 'draft shows its gaps to fill in');

  const resumeId = (await rest(`profiles?id=eq.${user.id}&select=active_resume_id`))[0].active_resume_id;
  const saved = await eventually(aiStories, (s) => s.length === 2);
  log(saved.length === 2 && saved.every((s) => s.is_draft && s.resume_id === resumeId), 'stories saved as drafts linked to the resume');
  const parsed = await eventually(() => rest(`resumes?id=eq.${resumeId}&select=parsed`), (r) => r[0]?.parsed);
  log(parsed[0]?.parsed?.roles?.[0]?.company === 'Shopwise', 'parsed resume structure saved');
  const qs = await eventually(aiQuestions, (q) => q.length === 1);
  log(qs.length === 1 && qs[0].tags.includes('resume'), 'resume question saved with source "ai" and tag "resume"');

  await page.locator('[data-testid="story-card"]', { hasText: 'HANDOFF story one' }).locator('button:has-text("Keep")').click();
  const badges = await eventually(() => page.locator('text=AI draft').count(), (n) => n === 1, 5000);
  log(badges === 1, 'Keep removes the draft badge');
  const kept = await eventually(aiStories, (s) => s.some((x) => x.title === 'HANDOFF story one' && !x.is_draft));
  log(kept.some((x) => x.title === 'HANDOFF story one' && !x.is_draft), 'Keep clears is_draft in the account');

  await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder*="Search"]', 'HANDOFF question');
  log(await page.isVisible('text=HANDOFF question: walk me through your career'), 'resume question appears in the question bank');
  log(await page.isVisible('text=From resume / JD'), 'source filter offers "From resume / JD"');

  // 3. Automatic path (fixtures)
  await clearAi();
  await rest(`resumes?id=eq.${resumeId}`, { method: 'PATCH', body: JSON.stringify({ parsed: null }) });
  await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Using your resume');
  await page.click('button:has-text("Generate draft stories and questions")');
  await page.waitForSelector('text=Added 3 draft stories and 2 resume questions', { timeout: 15000 });
  log(true, 'automatic run finished: 3 stories, 2 questions');
  const ends = (await usage()).map((u) => u.endpoint).sort();
  log(JSON.stringify(ends) === JSON.stringify(['resume:drafts', 'resume:parse', 'resume:questions']), `each step called once (${ends.join(', ')})`);
  log((await eventually(aiStories, (s) => s.length === 3)).length === 3, 'automatic drafts saved');

  // 4. Resume a run that stopped before the questions step
  await rest(`questions?owner_id=eq.${user.id}`, { method: 'DELETE' });
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="resume-banner"] button:has-text("Continue generating")');
  log(true, 'part-finished run offers "Continue generating"');
  await page.click('[data-testid="resume-banner"] button:has-text("Continue generating")');
  await page.waitForSelector('text=Added 2 resume questions.', { timeout: 15000 });
  const resumed = (await usage()).map((u) => u.endpoint);
  log(JSON.stringify(resumed) === JSON.stringify(['resume:questions']), `only the missing step ran (${resumed.join(', ')})`);
  log((await aiStories()).length === 3, 'existing drafts were not duplicated');

  // 5. Daily cap
  await admin('ai_usage', {
    method: 'POST',
    body: JSON.stringify([1, 2, 3].map(() => ({ user_id: user.id, endpoint: 'resume:drafts' }))),
  });
  await rest(`stories?user_id=eq.${user.id}`, { method: 'DELETE' });
  await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
  await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.location.reload());
  await page.waitForSelector('[data-testid="handoff-panel"]', { timeout: 15000 });
  log(await page.isVisible('text=used today’s automatic runs'), 'cap reached → hand-off offered with the reason');
  const call = (body) =>
    fetch(`${BASE}/api/ai/resume-step`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => ({ status: r.status, body: await r.json() }));
  const capped = await call({ resumeId, step: 'drafts' });
  log(capped.status === 429 && capped.body.error === 'cap_reached', 'API refuses the drafts step at the cap (429 cap_reached)');

  // 6. Bad input
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
  const badStep = await call({ resumeId, step: 'everything' });
  log(badStep.status === 400, 'API rejects an unknown step (400)');
  const notMine = await call({ resumeId: '00000000-0000-0000-0000-000000000000', step: 'parse' });
  log(notMine.status === 404, 'API refuses a resume the caller cannot read (404)');
  const anon = await fetch(`${BASE}/api/ai/resume-step`, { method: 'POST', body: '{}' });
  log(anon.status === 401, 'API requires a signed-in user (401)');

  // 7. Account offers drafts for a new resume
  await page.goto(`${BASE}/account`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Replace resume")');
  await page.click('button:has-text("Paste resume text instead")');
  await page.fill('textarea[aria-label="Resume text"]', RESUME + '\nUpdated.');
  await page.click('button:has-text("Save resume")');
  await page.waitForSelector('[data-testid="account-offer-drafts"]');
  log(await page.isVisible('text=Generate draft stories from this resume?'), 'Account offers drafts after a new resume (opt-in)');

  // 8. Unmapped glyphs. The ToUnicode map sends codes 0x80 and 0x82 to 0, as
  // some resume builders do for "+" and ligatures.
  const pdf = unmappedPdf([
    'Senior engineer with 7\x80 years of experience building web apps.',
    'Odd glyph here: xq\x82zz stays unreadable.',
    ...Array.from({ length: 6 }, (_, i) => `Line ${i + 1}: led the checkout rewrite across four brands and cut load time.`),
  ]);
  await page.goto(`${BASE}/account`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Replace resume")');
  await page.setInputFiles('[data-testid="resume-file"]', { name: 'glyphs.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.waitForSelector('text=Does this look right?', { timeout: 20000 });
  const extracted = await page.inputValue('textarea[aria-label="Resume text"]');
  log(extracted.includes('7+ years'), 'unmapped "+" after a number repaired automatically ("7+ years")');
  log(extracted.includes('xq\uFFFDzz'), 'an ambiguous glyph is shown as � rather than dropped');
  log(await page.isVisible('[data-testid="unreadable-warning"]'), 'warning shown for the unreadable character');
  await page.click('button:has-text("Fix with Claude")');
  await eventually(() => page.inputValue('textarea[aria-label="Resume text"]'), (t) => !t.includes('\uFFFD'), 10000);
  const fixed = await page.inputValue('textarea[aria-label="Resume text"]');
  log(!fixed.includes('\uFFFD') && fixed.includes('xq+zz'), 'Fix with Claude fills in the rest (test mode)');
  log(!(await page.isVisible('[data-testid="unreadable-warning"]')), 'warning disappears once nothing is unreadable');
  log((await usage()).some((u) => u.endpoint === 'resume:read'), 'Fix with Claude is counted in ai_usage');

  const read = (body, auth = true) =>
    fetch(`${BASE}/api/ai/resume-read`, {
      method: 'POST',
      headers: { ...(auth ? { Authorization: `Bearer ${access_token}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.status);
  log((await read({ pdf: 'x', text: 'y' }, false)) === 401, 'resume-read requires a signed-in user (401)');
  log((await read({ text: 'y' })) === 400, 'resume-read requires the PDF (400)');
  log((await read({ pdf: 'A'.repeat(4_100_000), text: 'y' })) === 413, 'resume-read refuses an oversize PDF (413)');
} finally {
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' }).catch(() => {});
  log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
}
