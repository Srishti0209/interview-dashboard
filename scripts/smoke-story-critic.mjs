// Phase 6 step 4, story critic + coverage matrix (dev server with
// AI_FIXTURE=1, test account):
//  1. "Get feedback" shows per-dimension scores and what to add, and saves
//     them without touching the rest of the story
//  2. "Fix with Builder" opens the builder at the suggested stage, once
//  3. Coverage tab: strong / draft stories per competency, free-text tags
//     matched, "Build a story for this" starts a builder aimed at it
//  4. hand-off import of feedback; API guards
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

const CRITIQUE = {
  score: 4,
  dimensions: ['Specificity', 'Ownership ("I" not "we")', 'Metrics', 'Stakes', 'Decisions and alternatives', 'Reflection', 'Length and pacing'].map((name) => ({ name, score: 4, note: 'HANDOFF note.' })),
  toAdd: ['HANDOFF: name the system you changed'],
  fixStage: 2,
};

const { user, access_token } = await getSmokeSession();
if (user.email === 'srishti.nimish@gmail.com') throw new Error('Refusing to run against the real account');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser);
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
const row = async (id) => (await rest(`stories?id=eq.${id}&select=*`))[0];

try {
  await rest(`stories?user_id=eq.${user.id}`, { method: 'DELETE' });
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
  const now = Date.now();
  const [rich, basic] = await rest('stories', {
    method: 'POST',
    body: JSON.stringify([
      {
        user_id: user.id, title: 'Canary migration', situation: 'Live marketplace.', task: 'Own go-live.',
        action: 'Canary: 5% to 100%.', result: 'Zero downtime.', applicable_to: ['Ownership', 'Leadership'], source: 'user', is_draft: false,
        details: { score: 8, bestFor: ['Ownership', 'Leadership'], beats: [{ name: 'Canary', text: '5% to 100%.' }], reflection: 'Trust matters.' },
        created_at: now, updated_at: now,
      },
      {
        user_id: user.id, title: 'Disagreed on API design', situation: 's', task: 't', action: 'a', result: 'r',
        applicable_to: ['conflict resolution'], source: 'ai', is_draft: true, details: {}, created_at: now + 1, updated_at: now + 1,
      },
    ]),
  });

  // 1. Get feedback
  await page.goto(`${BASE}/stories/${rich.id}`, { waitUntil: 'networkidle' });
  await page.click('[data-testid="story-critic"] button:has-text("Get feedback")');
  await page.waitForSelector('[data-testid="critique-dimensions"]');
  const critic = await page.locator('[data-testid="story-critic"]').innerText();
  log(critic.includes('7/10'), 'feedback shows the overall score');
  log((await page.locator('[data-testid="critique-dimensions"] li').count()) === 7, 'seven dimensions scored');
  log(critic.includes('Quantify the revenue at stake per day'), '"What to add" list shown');
  const saved = await eventually(() => row(rich.id), (s) => s.details?.critique?.score === 7);
  log(saved.details.critique.createdAt > 0 && saved.details.beats.length === 1 && saved.details.score === 8, 'feedback saved; story and its own score untouched');

  // 2. Fix with Builder → stage 6, once
  await page.click('button:has-text("Fix with Builder: Numbers and result")');
  await page.waitForSelector('[data-testid="story-builder"]');
  const guide = page.locator('[data-testid="stage-guide"]');
  log((await guide.innerText()).includes('Numbers and result'), 'builder opens at the suggested stage (6)');
  const last = await page.locator('[data-testid="builder-chat"] [data-role="assistant"]').last().innerText();
  log(last.startsWith('Let’s strengthen this part') && last.includes('numbers'), 'builder asks that stage’s question');
  await page.waitForFunction(() => !location.search.includes('stage='));
  log(true, '?stage is removed from the address');
  await eventually(() => row(rich.id), (s) => s.details?.builder?.stage === 6);
  const count = await page.locator('[data-testid="builder-chat"] [data-role]').count();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="builder-chat"]');
  log((await page.locator('[data-testid="builder-chat"] [data-role]').count()) === count, 'a reload does not add the question again');

  // 3. Coverage
  await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  await page.click('button[role="tab"]:has-text("Coverage")');
  await page.waitForSelector('[data-testid="coverage-matrix"]');
  const matrix = page.locator('[data-testid="coverage-matrix"]');
  log((await matrix.innerText()).includes('3 of 14'), 'summary counts covered competencies (3 of 14)');
  const ownership = page.locator('[data-testid="coverage-row"]', { hasText: 'Ownership' });
  log((await ownership.innerText()).includes('Canary migration') && (await ownership.innerText()).includes('8/10'), 'Ownership row shows the strong story with its score');
  log(!(await ownership.locator('button').count()), 'no "build" button where a strong story exists');
  const conflict = page.locator('[data-testid="coverage-row"]', { hasText: /^Conflict/ });
  log((await conflict.innerText()).includes('Disagreed on API design'), 'free-text tag "conflict resolution" counts for Conflict');
  log((await conflict.innerText()).includes('Build a stronger one'), 'a draft-only competency offers a stronger story');
  const failure = page.locator('[data-testid="coverage-row"]', { hasText: /^Failure/ });
  log((await failure.innerText()).includes('No story yet'), 'an uncovered competency says so');
  await failure.locator('button:has-text("Build a story for this")').click();
  await page.waitForSelector('[data-testid="story-builder"]');
  log((await page.locator('[data-testid="story-builder"]').innerText()).includes('for Failure'), '"Build a story for this" starts a builder aimed at Failure');
  const first = await page.locator('[data-testid="builder-chat"] [data-role="assistant"]').first().innerText();
  log(first.includes('failure'), 'opening question mentions the competency');

  // 4. Hand-off feedback on the draft
  await page.goto(`${BASE}/stories/${basic.id}`, { waitUntil: 'networkidle' });
  await page.click('[data-testid="story-critic"] button:has-text("Do it in Claude instead")');
  await page.fill('textarea[aria-label="Claude’s reply"]', JSON.stringify(CRITIQUE));
  await page.click('button:has-text("Import feedback")');
  await page.waitForSelector('[data-testid="critique-dimensions"]');
  log((await page.locator('[data-testid="story-critic"]').innerText()).includes('HANDOFF: name the system'), 'hand-off feedback imported and shown');

  const call = (body, auth = true) =>
    fetch(`${BASE}/api/ai/story-critique`, {
      method: 'POST',
      headers: { ...(auth ? { Authorization: `Bearer ${access_token}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.status);
  log((await call({ story: { title: 'x' } }, false)) === 401, 'story-critique requires sign-in (401)');
  log((await call({ story: { title: 'Empty' } })) === 400, 'story-critique refuses an empty story (400)');
  const usage = (await admin(`ai_usage?user_id=eq.${user.id}&select=endpoint`)).map((u) => u.endpoint);
  log(usage.filter((e) => e === 'story:critique').length === 1, `usage recorded (${usage.join(', ')})`);
} finally {
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' }).catch(() => {});
  log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
}
