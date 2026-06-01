import { chromium } from 'playwright';
const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) process.exitCode = 1; }

await page.goto(`${BASE}/mock`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Mock Interview');
// default 3 rounds preselected; start
await page.click('button:has-text("Start")');
await page.waitForSelector('text=/Round 1 \\/ \\d/', { timeout: 8000 });
log(true, 'mock started with rounds');

// timer present
log(/\d+:\d\d/.test((await page.textContent('body')) || ''), 'timer visible');

// round 1: rate + scratchpad + next
const rate = async () => {
  const stars = page.locator('.flex.items-center.gap-1 button');
  // click 4th star in the self-rate group (first star group on page)
  await page.locator('button:has(svg.lucide-star)').nth(3).click();
};
for (let i = 0; i < 3; i++) {
  await page.locator('textarea').first().fill(`round ${i + 1} work`);
  // self-rate: click the 4th star
  const starButtons = page.locator('button:has(svg.lucide-star)');
  if (await starButtons.count()) await starButtons.nth(3).click();
  await page.waitForTimeout(150);
  // Next / Finish button in scratchpad column
  await page.locator('button:has-text("Next round"), button:has-text("Finish")').first().click();
  await page.waitForTimeout(300);
}

await page.waitForSelector('text=Mock complete', { timeout: 8000 });
log(true, 'reached summary after 3 rounds');

await page.fill('textarea', 'Felt good about system design.');
await page.click('button:has-text("Save to history")');
await page.waitForTimeout(500);
log((await page.locator('button:has-text("Saved")').count()) > 0, 'session saved');

// Back to setup, history shows it
await page.click('button:has-text("Done")');
await page.waitForSelector('text=Past mocks');
await page.waitForTimeout(300);
log((await page.locator('text=/\\d rounds/').count()) > 0, 'mock appears in history');

// persists across reload
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('text=Past mocks');
await page.waitForTimeout(300);
log((await page.locator('text=/\\d rounds/').count()) > 0, 'history persists across reload');

await browser.close();
if (errors.length) { console.log('\nErrors:'); errors.slice(0,8).forEach(e=>console.log('  - '+e)); process.exitCode = 1; }
else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 9 SMOKE FAILED' : '\nPHASE 9 SMOKE PASSED');
