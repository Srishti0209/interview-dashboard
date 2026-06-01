import { chromium } from 'playwright';
const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) process.exitCode = 1; }

await page.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Story Bank');
await page.waitForTimeout(500);
const seeded = await page.locator('h3').count();
log(seeded >= 6, `seeded stories visible (${seeded} cards)`);

// Matcher
await page.fill('textarea', 'Tell me about a time you disagreed with your manager about a deadline');
await page.waitForTimeout(500);
const matchText = await page.textContent('body');
log(/matchingstor|matching stor/i.test((matchText||'').replace(/\s/g,' ')) || /matching/i.test(matchText||''), 'matcher returns results text');
await page.fill('textarea', '');
await page.waitForTimeout(300);

// Create a story
const title = 'SMOKE STORY ' + Date.now();
await page.click('button:has-text("New story")');
await page.waitForSelector('text=New story');
await page.fill('#story-title', title);
await page.locator('div[role="dialog"] textarea').first().fill('Prod incident at 2am.');
await page.click('button:has-text("Create story")');
await page.waitForTimeout(600);
log((await page.locator(`h3:has-text("${title}")`).count()) > 0, 'created a new story');

await browser.close();
if (errors.length) { console.log('\nErrors:'); errors.slice(0,8).forEach(e=>console.log('  - '+e)); process.exitCode = 1; }
else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 7 SMOKE FAILED' : '\nPHASE 7 SMOKE PASSED');
