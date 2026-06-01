// Phase 4 smoke: create a user question, verify it opens, edit it, delete it.
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

const title = 'SMOKE Q ' + Date.now();

// Create
await page.goto(`${BASE}/my-questions/new`, { waitUntil: 'networkidle' });
await page.fill('#q-title', title);
// body editor textarea (first textarea in the form)
await page.locator('textarea').first().fill('What is the time complexity?');
// tags
const tagInput = page.locator('input[placeholder*="tag"]');
await tagInput.fill('smoke-tag');
await tagInput.press('Enter');
await page.click('button:has-text("Create question")');
await page.waitForURL(/\/questions\/[a-f0-9-]+$/, { timeout: 10000 });
const detailUrl = page.url();
await page.waitForSelector(`h1:has-text("${title}")`);
log(true, `created user question -> ${detailUrl}`);

// "My question" badge + edit/delete present
const isUser = await page.locator('text=My question').count();
log(isUser > 0, 'user question shows "My question" badge');

// Edit
await page.click('button[title="Edit"]');
await page.waitForURL(/\/my-questions\/new\?edit=/, { timeout: 10000 });
await page.fill('#q-title', title + ' EDITED');
await page.click('button:has-text("Save changes")');
await page.waitForSelector(`h1:has-text("${title} EDITED")`, { timeout: 10000 });
log(true, 'edited user question title');

// Search finds it
await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
await page.fill('input[placeholder*="Search"]', 'smoke-tag');
await page.waitForTimeout(400);
const found = await page.locator(`text=${title} EDITED`).count();
log(found > 0, 'edited question found by tag search');

// Delete
await page.goto(detailUrl, { waitUntil: 'networkidle' });
await page.click('button[title="Delete"]');
await page.click('button:has-text("Delete"):visible');
await page.waitForURL(/\/questions$/, { timeout: 10000 });
log(true, 'deleted user question, redirected to bank');

// Confirm gone
await page.goto(detailUrl, { waitUntil: 'networkidle' });
const gone = await page.locator('text=Question not found').count();
log(gone > 0, 'deleted question no longer exists');

await browser.close();
if (errors.length) {
  console.log('\nErrors:');
  errors.slice(0, 10).forEach((e) => console.log('  - ' + e));
  process.exitCode = 1;
} else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 4 SMOKE FAILED' : '\nPHASE 4 SMOKE PASSED');
