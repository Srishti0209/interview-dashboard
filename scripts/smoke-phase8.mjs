import { chromium } from 'playwright';
const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) process.exitCode = 1; }

await page.goto(`${BASE}/companies`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Companies');
await page.waitForTimeout(400);
log((await page.locator('h3').count()) >= 13, `company grid shows ${await page.locator('h3').count()} cards`);

// Open Anthropic
await page.click('text=Anthropic');
await page.waitForSelector('text=Application status', { timeout: 8000 });
log(true, 'opened Anthropic detail');

// Set status to Onsite
await page.getByRole('combobox').first().click();
await page.waitForTimeout(250);
await page.getByRole('option', { name: 'Onsite' }).click();
await page.waitForTimeout(500);

// Timeline should show Onsite with a date (criteria #6)
await page.waitForSelector('text=Timeline', { timeout: 5000 });
const timeline = await page.textContent('body');
log(/Onsite/.test(timeline || ''), 'status changed to Onsite');
log(/\d{1,2}\s\w{3}\s20\d\d/.test(timeline || ''), 'timeline logged a date');

// Linked questions section present
log(/Tagged questions/.test(timeline || ''), 'tagged questions section present');

// Reload persists
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('text=Timeline', { timeout: 8000 });
log(/Onsite/.test((await page.textContent('body')) || ''), 'status persisted across reload');

await browser.close();
if (errors.length) { console.log('\nErrors:'); errors.slice(0,8).forEach(e=>console.log('  - '+e)); process.exitCode = 1; }
else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 8 SMOKE FAILED' : '\nPHASE 8 SMOKE PASSED');
