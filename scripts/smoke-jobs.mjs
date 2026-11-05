// Phase 6 step 5, JD page + gap analysis (dev server with AI_FIXTURE=1,
// test account):
//  1. add a job (paste JD + values; upload fills the JD from a file)
//  2. "Analyse gaps": parsed needs, story gaps linked to the user's stories,
//     topics with "Practise these", new questions added once (no duplicates
//     on re-analysis)
//  3. "Practise these" shows exactly those questions; "Build this story"
//     starts a builder aimed at the value
//  4. hand-off import drops links to things the user doesn't have
//  5. API guards; deleting a job
import { chromium } from 'playwright';
import { newSignedInContext, getSmokeSession, rest, eventually, url } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}
async function admin(path, init = {}) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: k, Authorization: `Bearer ${k}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

const JD = Array.from({ length: 6 }, (_, i) => `Requirement ${i + 1}: senior frontend engineer to own checkout and payments, React, TypeScript, mentoring.`).join('\n');
const HANDOFF_REPORT = {
  parsed: { skills: ['Go'], seniority: 'Staff', focusAreas: ['Platform'], likelyRounds: ['System design'], values: ['Bias for action'] },
  storyGaps: [{ value: 'Bias for action', storyId: 'not-a-real-story', otherStoryIds: ['not-a-real-story-2'], strength: 'partial', advice: 'HANDOFF advice.', likelyQuestions: ['HANDOFF likely question?'] }],
  roundPrep: [{ round: 'HANDOFF round', questionTypes: ['HANDOFF type'], examples: ['HANDOFF example?'] }],
  questionGaps: [{ topic: 'HANDOFF topic', reason: 'r', questionIds: ['not-a-real-question'] }],
  newQuestions: [],
};

const { user, access_token } = await getSmokeSession();
if (user.email === 'srishti.nimish@gmail.com') throw new Error('Refusing to run against the real account');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser);
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
const jobs = () => rest('job_descriptions?select=*');
const ownQuestions = () => rest(`questions?owner_id=eq.${user.id}&select=id,title,tags,company,source`);

try {
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
  await rest(`stories?user_id=eq.${user.id}`, { method: 'DELETE' });
  const now = Date.now();
  const [story] = await rest('stories', {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, title: 'Checkout ownership story', situation: 's', task: 't', action: 'a', result: 'r', applicable_to: ['Ownership'], details: { score: 6 }, created_at: now, updated_at: now }),
  });

  // 1. Add a job
  await page.goto(`${BASE}/jobs`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="add-job"]');
  log(await page.isDisabled('button:has-text("Save job")'), 'cannot save a job without the JD');
  await page.setInputFiles('[data-testid="jd-file"]', { name: 'jd.txt', mimeType: 'text/plain', buffer: Buffer.from(JD) });
  await eventually(() => page.inputValue('textarea[aria-label="Job description"]'), (t) => t.includes('Requirement 6'), 5000);
  log((await page.inputValue('textarea[aria-label="Job description"]')).includes('Requirement 6'), 'uploading a file fills in the JD');
  await page.fill('input[placeholder="e.g. Monzo"]', 'Acme Pay');
  await page.fill('input[placeholder="e.g. Senior Frontend Engineer"]', 'Senior Frontend Engineer');
  await page.fill('textarea[aria-label="Company values"]', 'Customer obsession. Ownership. Disagree and commit.');
  await page.click('button:has-text("Save job")');
  await page.waitForSelector('[data-testid="job-detail"]');
  const [job] = await eventually(jobs, (j) => j.length === 1);
  log(job?.company === 'Acme Pay' && job.file_name === 'jd.txt' && job.company_values.includes('Customer obsession'), 'job saved with company, file name and values');

  // 2. Analyse
  await page.click('button:has-text("Analyse gaps")');
  await page.waitForSelector('[data-testid="jd-report"]', { timeout: 15000 });
  const report = await page.locator('[data-testid="jd-report"]').innerText();
  log(report.includes('Customer obsession') && report.includes('Senior'), 'report shows what the job needs (values, seniority)');
  const storyGaps = page.locator('[data-testid="story-gaps"]');
  log((await storyGaps.innerText()).includes('Checkout ownership story'), 'a story gap links to the user’s matching story');
  log((await storyGaps.innerText()).includes('Missing'), 'a missing value is flagged');
  log((await storyGaps.innerText()).includes('Tell me about a decision you disagreed with'), 'each value lists likely questions');
  log((await page.locator('[data-testid="round-prep"]').innerText()).includes('Checkout and payment flows'), 'question types to prepare are shown per round');
  log(await page.isVisible('[data-testid="question-gaps"] a:has-text("Practise these (3)")'), 'topic offers "Practise these (3)"');
  log((await page.locator('[data-testid="new-questions"]').innerText()).includes('payment provider outage'), 'new questions are listed');
  const saved = await eventually(jobs, (j) => j[0]?.gaps?.storyGaps?.length === 2);
  log(saved[0].parsed?.values?.length === 3 && saved[0].gaps.newQuestionIds.length === 1, 'analysis saved on the job');
  const qs = await ownQuestions();
  const added = qs.find((q) => q.title.includes('payment provider outage'));
  log(added && added.source === 'ai' && added.tags.includes('jd:acme-pay') && added.company.includes('Acme Pay'), 'new question saved with source "ai", tag jd:acme-pay and the company');

  await page.click('button:has-text("Analyse again")');
  await page.waitForTimeout(1500);
  await eventually(jobs, (j) => j[0]?.gaps?.analysedAt > saved[0].gaps.analysedAt);
  const again = (await ownQuestions()).filter((q) => q.title.includes('payment provider outage'));
  log(again.length === 1, 're-analysing does not duplicate questions');

  // 3. Practise these / Build this story
  await page.click('[data-testid="question-gaps"] a:has-text("Practise these")');
  await page.waitForSelector('[data-testid="pinned-questions"]');
  const banner = await page.locator('[data-testid="pinned-questions"]').innerText();
  log(banner.includes('Showing 3 questions') && banner.includes('Payments system design (Acme Pay)'), 'Question Bank shows exactly those 3 questions, labelled');
  await page.click('button:has-text("Show all questions")');
  const cleared = await page
    .waitForSelector('[data-testid="pinned-questions"]', { state: 'detached', timeout: 5000 })
    .then(() => true, () => false);
  log(cleared && !(await page.evaluate(() => location.search.includes('ids='))), '"Show all questions" clears the filter');
  await page.goto(`${BASE}/jobs/${job.id}`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="story-gaps"] li', { hasText: 'Disagree and commit' }).locator('button:has-text("Build this story")').click();
  await page.waitForSelector('[data-testid="story-builder"]');
  log((await page.locator('[data-testid="story-builder"]').innerText()).includes('for Disagree and commit'), '"Build this story" starts a builder aimed at the value');

  // 4. Hand-off import on a second job
  const [job2] = await rest('job_descriptions', {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, company: 'Beta', title: 'Staff Engineer', raw_text: JD, company_values: '' }),
  });
  await page.goto(`${BASE}/jobs/${job2.id}`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Do it in Claude instead")');
  await page.fill('textarea[aria-label="Claude’s reply"]', JSON.stringify(HANDOFF_REPORT));
  await page.click('button:has-text("Import analysis")');
  await page.waitForSelector('[data-testid="jd-report"]');
  log((await page.locator('[data-testid="story-gaps"]').innerText()).includes('HANDOFF advice.'), 'hand-off analysis imported');
  const j2 = await eventually(async () => (await rest(`job_descriptions?id=eq.${job2.id}&select=gaps`))[0], (j) => j.gaps);
  log(j2.gaps.storyGaps[0].otherStoryIds.length === 0 && j2.gaps.roundPrep?.[0]?.round === 'HANDOFF round', 'unknown back-up stories dropped; round prep imported');
  log(j2.gaps.storyGaps[0].storyId === '' && j2.gaps.questionGaps[0].questionIds.length === 0, 'links to unknown stories and questions are dropped');
  log(!(await page.isVisible('[data-testid="question-gaps"] a:has-text("Practise these")')), 'no "Practise these" when no known questions remain');

  // 5. Jobs list, API guards, delete
  await page.goto(`${BASE}/jobs`, { waitUntil: 'networkidle' });
  log((await page.locator('[data-testid="job-row"]').count()) === 2 && (await page.locator('[data-testid="job-row"]').first().innerText()).length > 0, 'Jobs list shows both jobs');
  const call = (body, auth = true) =>
    fetch(`${BASE}/api/ai/jd-gaps`, {
      method: 'POST',
      headers: { ...(auth ? { Authorization: `Bearer ${access_token}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.status);
  log((await call({ jd: { text: JD } }, false)) === 401, 'jd-gaps requires sign-in (401)');
  log((await call({ jd: { text: 'too short' } })) === 400, 'jd-gaps refuses a JD that is too short (400)');
  await page.goto(`${BASE}/jobs/${job2.id}`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Delete")');
  await page.waitForSelector('[data-testid="job-row"]');
  await eventually(jobs, (j) => j.length === 1);
  log((await jobs()).length === 1 && (await page.locator('[data-testid="job-row"]').count()) === 1, 'deleting a job removes it');
  const usage = (await admin(`ai_usage?user_id=eq.${user.id}&select=endpoint`)).map((u) => u.endpoint);
  log(usage.filter((e) => e === 'jd:gaps').length === 2, `usage recorded (${usage.join(', ')})`);
} finally {
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' }).catch(() => {});
  log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
}
