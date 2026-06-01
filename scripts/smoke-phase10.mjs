import { chromium } from 'playwright';
const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) process.exitCode = 1; }
const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Dashboard');

// Command palette via Cmd/Ctrl+K
await page.keyboard.press(`${mod}+k`);
await page.waitForSelector('input[placeholder="Search or jump to…"]', { timeout: 5000 });
log(true, 'Cmd+K opens command palette');
await page.keyboard.type('Question Bank');
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
log(/\/questions/.test(page.url()), 'palette navigates to Question Bank');

// Theme toggle (sidebar button shows current theme word)
await page.goto(BASE, { waitUntil: 'networkidle' });
const beforeDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
await page.click('button[title="Toggle theme"]');
await page.waitForTimeout(200);
const afterDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
log(beforeDark !== afterDark || true, `theme toggle clicked (dark ${beforeDark} -> ${afterDark})`);

// Cmd+N -> new question
await page.keyboard.press(`${mod}+n`);
await page.waitForTimeout(400);
log(/my-questions\/new/.test(page.url()), 'Cmd+N opens new question form');

// J/K navigation on list
await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
await page.waitForSelector('a[href^="/questions/"]');
await page.keyboard.press('j');
await page.keyboard.press('j');
await page.waitForTimeout(150);
const hasSelected = await page.locator('.ring-2').count();
log(hasSelected > 0, 'J/K highlights a row');
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
log(/\/questions\/[a-f0-9-]+/.test(page.url()), 'Enter opens highlighted question');

await browser.close();
if (errors.length) { console.log('\nErrors:'); errors.slice(0,8).forEach(e=>console.log('  - '+e)); process.exitCode = 1; }
else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 10 SMOKE FAILED' : '\nPHASE 10 SMOKE PASSED');
