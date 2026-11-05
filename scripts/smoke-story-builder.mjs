// Phase 6 step 3, Story Builder (dev server with AI_FIXTURE=1, no API calls):
//  1. a draft's "Deepen" opens the builder: opening question, stage guide
//     with checklist and sample answer
//  2. an answer streams back the next stage's question (no marker visible)
//  3. "Next stage" moves on for free; the session survives a reload
//  4. stage bar previews another stage's guide
//  5. "Write up my story" saves the rich format and opens the story page
//     (score, beats, timings, versions, deep-dive), and Edit saves changes
//  6. "Build a story" starts from scratch; the hand-off imports a write-up
//  7. API guards
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

const WRITE_UP = {
  title: 'HANDOFF built story', score: 6, bestFor: ['Ownership'], situation: 'At a bank, forms were on paper.',
  task: 'I owned the digital version.', beats: [{ name: 'Mapping the forms', text: 'I mapped all 25 forms.' }],
  result: 'Customers self-served.', reflection: 'Start with the riskiest form.', metrics: '25 forms',
  deepDive: [{ question: 'Why start there?', answer: 'Highest volume.' }], people: 'Two designers.',
  whatWentWrong: 'Legal review slipped a week.', short30: 'I digitised 25 forms.', long2min: 'Longer version.',
  gaps: ['Adoption figures'], tags: ['banking'],
};

const { user, access_token } = await getSmokeSession();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser);
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
const storyRow = async (id) => (await rest(`stories?id=eq.${id}&select=*`))[0];

try {
  await rest(`stories?user_id=eq.${user.id}`, { method: 'DELETE' });
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
  const [draft] = await rest('stories', {
    method: 'POST',
    body: JSON.stringify({
      user_id: user.id, title: 'Checkout migration draft', situation: 'Old framework.', task: 'Lead it.',
      action: 'Migrated it.', result: 'Done.', source: 'ai', is_draft: true,
      details: { gaps: ['What was at stake?'] }, created_at: Date.now(), updated_at: Date.now(),
    }),
  });

  // 1. Open the builder from the card
  await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="story-card"]', { hasText: 'Checkout migration draft' }).locator('a:has-text("Deepen")').click();
  await page.waitForSelector('[data-testid="story-builder"]');
  const first = await page.locator('[data-testid="builder-chat"] [data-role="assistant"]').first().innerText();
  log(first.includes('Checkout migration draft') && first.includes('what was at stake'), 'opening question names the story and asks about stakes');
  const guide = page.locator('[data-testid="stage-guide"]');
  log((await guide.innerText()).includes('Context and stakes'), 'stage guide shows stage 1');
  log((await guide.innerText()).includes('What a strong answer covers'), 'stage guide shows the checklist');
  log((await guide.innerText()).includes('£2m of bookings'), 'stage guide shows a sample answer');

  // 2. Answer → streamed next question
  await page.fill('textarea[aria-label="Your answer"]', 'Checkout carried £40k an hour at Wowcher-scale traffic.');
  await page.click('button:has-text("Send")');
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="builder-chat"] [data-role="assistant"]').length >= 2);
  await eventually(() => guide.innerText(), (t) => t.includes('Your role and ownership'), 5000);
  const reply = await page.locator('[data-testid="builder-chat"] [data-role="assistant"]').nth(1).innerText();
  log(reply.includes('What exactly was your role') && !reply.includes('<stage'), 'reply asks the next stage’s question, marker hidden');
  log((await guide.innerText()).includes('Your role and ownership'), 'stage guide moves to stage 2');

  // 3. Next stage, then reload
  await page.click('button:has-text("Next stage")');
  log((await page.locator('[data-testid="builder-chat"] [data-role="assistant"]').last().innerText()).includes('Let’s move on'), '"Next stage" adds the next question without an AI call');
  await eventually(() => storyRow(draft.id), (s) => s.details?.builder?.stage === 3);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="builder-chat"]');
  const bubbles = await page.locator('[data-testid="builder-chat"] [data-role]').count();
  log(bubbles === 4, `session survives a reload (${bubbles} messages)`);
  log((await guide.innerText()).includes('Key decisions and alternatives'), 'stage survives a reload (stage 3)');

  // 4. Preview another stage
  await page.locator('ol[aria-label="Stages"] button').nth(6).click();
  log((await guide.innerText()).includes('Reflection') && (await guide.innerText()).includes('preview'), 'stage bar previews stage 7');

  // 5. Write up → story page
  await page.click('button:has-text("Write up my story")');
  await page.waitForSelector('[data-testid="story-detail"]', { timeout: 15000 });
  const detail = await page.locator('[data-testid="story-detail"]').innerText();
  log(detail.includes('Checkout rewrite across four brands'), 'write-up opens the story page with the new title');
  log((await page.locator('[data-testid="story-score"]').innerText()) === '8/10', 'score shown (8/10)');
  log(detail.includes('Beat 2: Gradual traffic split'), 'action beats shown by name');
  log(/~\d+s/.test(detail), 'sections show speaking-time estimates');
  log(await page.isVisible('[data-testid="deep-dive"]'), 'deep-dive prep shown');
  await page.click('button[role="tab"]:has-text("30 seconds")');
  log((await page.locator('[data-testid="story-detail"]').innerText()).includes('30-second version'), '30-second version tab works');
  const saved = await eventually(() => storyRow(draft.id), (s) => s.details?.beats?.length === 3);
  log(!saved.is_draft && saved.details.beats.length === 3 && saved.details.builder?.turns?.length === 4, 'story saved: no longer a draft, beats + builder transcript kept');
  log(saved.action.includes('Gradual traffic split:'), 'plain Action field filled from the beats (matcher, backups)');

  await page.click('button:has-text("Edit")');
  await page.fill('label:has-text("Reflection") textarea', 'EDITED reflection.');
  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=EDITED reflection.');
  const edited = await eventually(() => storyRow(draft.id), (s) => s.details?.reflection === 'EDITED reflection.');
  log(edited.details.reflection === 'EDITED reflection.' && edited.details.beats.length === 3, 'Edit saves changes and keeps the rest');

  // 6. Build from scratch, finish via the hand-off
  await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Build a story")');
  await page.waitForSelector('[data-testid="story-builder"]');
  log((await page.locator('h1').innerText()) === 'New story', '"Build a story" starts a blank story');
  await page.click('button:has-text("Do it in Claude instead")');
  await page.click('button:has-text("Copy prompt")');
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  log(prompt.includes('Key decisions and alternatives') && prompt.includes('"deepDive"') && !prompt.includes('<stage>'), 'hand-off prompt runs the staged interview and ends with the JSON shape');
  await page.fill('textarea[aria-label="Claude’s reply"]', '```json\n' + JSON.stringify(WRITE_UP) + '\n```');
  await page.click('button:has-text("Import my story")');
  await page.waitForSelector('[data-testid="story-detail"]');
  log((await page.locator('h1').innerText()) === 'HANDOFF built story', 'hand-off write-up imported and shown');

  // 7. API guards
  const call = (path, body, auth = true) =>
    fetch(`${BASE}/api/ai/${path}`, {
      method: 'POST',
      headers: { ...(auth ? { Authorization: `Bearer ${access_token}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.status);
  log((await call('story-chat', { turns: [{ role: 'user', content: 'hi' }] }, false)) === 401, 'story-chat requires sign-in (401)');
  log((await call('story-chat', { turns: [{ role: 'assistant', content: 'q' }] })) === 400, 'story-chat requires the candidate to speak last (400)');
  log((await call('story-write', { turns: [{ role: 'assistant', content: 'q' }] })) === 400, 'story-write needs at least one answer (400)');
  const usage = (await admin(`ai_usage?user_id=eq.${user.id}&select=endpoint`)).map((u) => u.endpoint);
  log(usage.filter((e) => e === 'story:chat').length === 1 && usage.filter((e) => e === 'story:write').length === 1, `usage recorded (${usage.join(', ')})`);
} finally {
  await admin(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' }).catch(() => {});
  log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
}
