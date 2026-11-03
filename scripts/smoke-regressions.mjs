// Regression checks for:
//  1. switching questions via ⌘K with pending edits must not leak/misdirect
//     the personal answer into another question
//  2. "Hide model answers" setting persists and hides the model answer
//  3. opening + leaving a note without edits does not bump its updatedAt
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

// Read rows straight from IndexedDB.
const dbAll = (table) =>
  page.evaluate(
    (table) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('InterviewPrep');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const r = req.result.transaction(table).objectStore(table).getAll();
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        };
      }),
    table,
  );

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Dashboard', { timeout: 15000 });

// ---------- 1. autosave across question switch ----------
const qs = (await dbAll('questions')).filter((q) => q.source === 'seed');
const [A, B] = qs;
await page.goto(`${BASE}/questions/${A.id}`, { waitUntil: 'networkidle' });
await page.waitForSelector(`h1:has-text("${A.title}")`);
await page.click('button:has-text("My Answer")');
const answerBox = 'textarea[placeholder*="your own words"]';
await page.fill(answerBox, 'ANSWER-FOR-A');

// Jump to B before the 5s debounce fires.
await page.locator('h1').click();
await page.keyboard.press('Meta+k');
await page.fill('input[placeholder="Search or jump to…"]', B.title);
await page.keyboard.press('Enter');
await page.waitForSelector(`h1:has-text("${B.title}")`);
await page.click('button:has-text("My Answer")');
const bText = await page.inputValue(answerBox);
log(bText === (B.personalAnswer ?? ''), `B's editor does not show A's draft ("${bText}")`);

// Type in B and leave via ⌘N while still focused (no blur flush), so only the
// unmount flush saves — it must target B, not the first question mounted.
await page.locator(answerBox).click();
await page.keyboard.type('ANSWER-FOR-B');
await page.keyboard.press('Meta+n');
await page.waitForURL(/my-questions/);
await page.waitForTimeout(500);

const after = new Map((await dbAll('questions')).map((q) => [q.id, q]));
log(after.get(A.id).personalAnswer === 'ANSWER-FOR-A', `A saved its own answer ("${after.get(A.id).personalAnswer}")`);
log(after.get(B.id).personalAnswer === 'ANSWER-FOR-B', `B saved its own answer ("${after.get(B.id).personalAnswer}")`);

// ---------- 2. hide model answers ----------
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await page.click('#hide-answers');
await page.reload({ waitUntil: 'networkidle' });
const checked = await page.getAttribute('#hide-answers', 'data-state');
log(checked === 'checked', 'hide-answers setting survives reload');

const withModel = qs.slice(2).find((q) => q.answer?.trim() && !q.personalAnswer);
await page.goto(`${BASE}/questions/${withModel.id}`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Answer hidden — click to reveal', { timeout: 5000 })
  .then(() => log(true, 'model answer is hidden'))
  .catch(() => log(false, 'model answer is hidden'));

// ---------- 3. note updatedAt not bumped on open/leave ----------
await page.goto(`${BASE}/notes`, { waitUntil: 'networkidle' });
await page.keyboard.press('Meta+Shift+n');
await page.waitForURL(/\/notes\/.+/);
await page.waitForTimeout(300);
const noteId = page.url().split('/notes/')[1];
const before = (await dbAll('notes')).find((n) => n.id === noteId).updatedAt;
await page.waitForTimeout(50);
await page.locator('a[href="/questions"]').first().click();
await page.waitForTimeout(500);
const afterTs = (await dbAll('notes')).find((n) => n.id === noteId).updatedAt;
log(before === afterTs, 'untouched note keeps its updatedAt');

// Edited title still flushes on leave.
await page.goto(`${BASE}/notes/${noteId}`, { waitUntil: 'networkidle' });
await page.fill('input[placeholder="Untitled note"]', 'Renamed');
await page.locator('a[href="/questions"]').first().click();
await page.waitForTimeout(500);
const renamed = (await dbAll('notes')).find((n) => n.id === noteId).title;
log(renamed === 'Renamed', `edited title flushed on leave ("${renamed}")`);

log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(process.exitCode ? '\nREGRESSION SMOKE FAILED' : '\nREGRESSION SMOKE PASSED');
