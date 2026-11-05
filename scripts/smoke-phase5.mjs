// Phase 5 smoke: review a card, confirm review state persists, streak logs,
// and a back-dated due card appears in the dashboard queue.
import { chromium } from 'playwright';
import { newSignedInContext, questionsWithState, eventually, rest } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await newSignedInContext(browser)).newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

// Open first question, rate Good
await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
await page.click('a[href^="/questions/"]');
await page.waitForSelector('text=Spaced repetition');
const qUrl = page.url();
const qid = qUrl.split('/questions/')[1];
await page.click('button:has-text("Good")');
await page.waitForTimeout(500);

// Read the review state from the account (synced asynchronously).
const review = (
  await eventually(questionsWithState, (all) => all.find((q) => q.id === qid)?.review)
).find((q) => q.id === qid)?.review;
log(!!review, `review state created for ${qid}`);
log(review?.reviewCount === 1, `reviewCount = ${review?.reviewCount}`);
log(review?.intervalDays === 1, `intervalDays = ${review?.intervalDays} (new+good=1)`);
log(review?.nextDue > Date.now(), 'nextDue is in the future');

// Streak logged today
const streak = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('studyLog') || '[]'),
);
log(streak.length >= 1, `study log has ${streak.length} day(s)`);
const days = await eventually(() => rest('study_days?select=day'), (d) => d.length > 0);
log(days.length >= 1, `study day saved to the account (${days.map((d) => d.day).join(', ')})`);

// Back-date the review in the account so it's due now (as if from another
// device), then check the dashboard queue picks it up on the next app load.
await rest(`user_question_state?question_id=eq.${qid}`, {
  method: 'PATCH',
  body: JSON.stringify({ next_due: Date.now() - 86400000 }),
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector("text=Today's review queue");
const dueLink = await page
  .locator(`a[href="/questions/${qid}"]`)
  .first()
  .waitFor({ timeout: 10000 })
  .then(() => 1)
  .catch(() => 0);
log(dueLink > 0, 'back-dated card appears in dashboard due queue');

// Streak stat shows >=1
const streakText = await page.textContent('body');
log(/day streak|Streak/i.test(streakText || ''), 'dashboard shows streak');

await browser.close();
if (errors.length) {
  console.log('\nErrors:');
  errors.slice(0, 10).forEach((e) => console.log('  - ' + e));
  process.exitCode = 1;
} else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 5 SMOKE FAILED' : '\nPHASE 5 SMOKE PASSED');
