// Phase 5 smoke: review a card, confirm review state persists, streak logs,
// and a back-dated due card appears in the dashboard queue.
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
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

// Read review state straight from IndexedDB via Dexie in-page
const review = await page.evaluate(async (id) => {
  const req = indexedDB.open('InterviewPrep');
  return await new Promise((resolve) => {
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('reviewStates', 'readonly');
      const get = tx.objectStore('reviewStates').get(id);
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}, qid);
log(!!review, `review state created for ${qid}`);
log(review?.reviewCount === 1, `reviewCount = ${review?.reviewCount}`);
log(review?.intervalDays === 1, `intervalDays = ${review?.intervalDays} (new+good=1)`);
log(review?.nextDue > Date.now(), 'nextDue is in the future');

// Streak logged today
const streak = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('studyLog') || '[]'),
);
log(streak.length >= 1, `study log has ${streak.length} day(s)`);

// Back-date the review so it's due now, then check dashboard queue
await page.evaluate(async (id) => {
  const req = indexedDB.open('InterviewPrep');
  await new Promise((resolve) => {
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('reviewStates', 'readwrite');
      const store = tx.objectStore('reviewStates');
      const get = store.get(id);
      get.onsuccess = () => {
        const r = get.result;
        r.nextDue = Date.now() - 86400000; // yesterday
        store.put(r);
      };
      tx.oncomplete = () => resolve();
    };
  });
}, qid);

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector("text=Today's review queue");
await page.waitForTimeout(500);
const dueLink = await page.locator(`a[href="/questions/${qid}"]`).count();
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
