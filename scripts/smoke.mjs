// Real-browser smoke test using the installed Google Chrome.
// Verifies: app boots, seeding populates the bank, list renders,
// detail page tabs work, and a personal answer persists across reload.
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

// 1. Boot + seed
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Dashboard', { timeout: 15000 });
log(true, 'app booted to Dashboard');

// 2. Questions list seeded
await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=/of 161 questions/', { timeout: 15000 });
const countText = await page.textContent('p:has-text("questions")');
log(/161/.test(countText || ''), `question bank shows count: "${countText?.trim()}"`);

// 3. Search filters
await page.fill('input[placeholder*="Search"]', 'React');
await page.waitForTimeout(400);
const afterSearch = await page.textContent('p:has-text("questions")');
log(
  afterSearch !== countText,
  `search narrows results: "${afterSearch?.trim()}"`,
);
await page.fill('input[placeholder*="Search"]', '');
await page.waitForTimeout(200);

// 4. Open first question detail
await page.click('a[href^="/questions/"]');
await page.waitForSelector('text=Question', { timeout: 10000 });
await page.waitForSelector('button:has-text("My Answer")');
log(true, 'opened a question detail with tabs');

// 5. Type a personal answer, blur to save
const marker = 'SMOKE_TEST_ANSWER_' + Date.now();
// ensure My Answer tab active
await page.click('button:has-text("My Answer")');
const ta = page.locator('textarea').first();
await ta.click();
await ta.fill(marker);
await page.click('h1'); // blur
await page.waitForTimeout(600);
const url = page.url();
log(true, `typed personal answer at ${url}`);

// 6. Reload -> persisted
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('button:has-text("My Answer")');
await page.click('button:has-text("My Answer")');
const persisted = await page.locator('textarea').first().inputValue();
log(persisted === marker, `personal answer persisted across reload (${persisted === marker})`);

// 7. Model Answer tab reveal
const modelTab = page.getByRole('tab', { name: 'Model Answer' });
if (await modelTab.count()) {
  await modelTab.click();
  await page.waitForTimeout(200);
  log(true, 'model answer tab present and clickable');
}

await browser.close();

if (errors.length) {
  console.log('\nConsole/page errors:');
  for (const e of errors.slice(0, 10)) console.log('  - ' + e);
  process.exitCode = 1;
} else {
  console.log('\nNo console/page errors.');
}
console.log(process.exitCode ? '\nSMOKE FAILED' : '\nSMOKE PASSED');
