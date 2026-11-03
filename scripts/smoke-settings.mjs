// Settings: export → wipe → import round-trips data (criteria #7),
// and refreshing the question bank preserves personal answers (criteria #8).
import { chromium } from 'playwright';
import { newSignedInContext, resetSmokeData, questionsWithState, eventually } from './lib/auth.mjs';
import { readFileSync } from 'node:fs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, { acceptDownloads: true });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) process.exitCode = 1; }

const marker = 'BACKUP_MARKER_' + Date.now();

// 1. Write a personal answer + bookmark on the first question
await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
await page.click('a[href^="/questions/"]');
await page.waitForSelector('button:has-text("My Answer")');
const qUrl = page.url();
await page.click('button:has-text("My Answer")');
await page.locator('textarea').first().fill(marker);
await page.click('h1');
await page.click('button[title="Bookmark"]');
await page.waitForTimeout(800);
log(true, 'wrote personal answer + bookmark');

// 2. Export
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button:has-text("Export all")'),
]);
const path = await download.path();
const backup = JSON.parse(readFileSync(path, 'utf8'));
const hasMarker = JSON.stringify(backup.tables.questions).includes(marker);
log(hasMarker, 'export JSON contains the personal answer');

// 3. Wipe the account's data, then import the backup
await eventually(questionsWithState, (all) => all.some((q) => q.personalAnswer === marker));
await resetSmokeData();
const wiped = await questionsWithState();
log(!wiped.some((q) => q.personalAnswer === marker), 'account data wiped before import');
page.once('dialog', (d) => d.accept()); // "Replace … with this backup?"
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await page.setInputFiles('input[type="file"]', path);
await page.waitForTimeout(3000); // import + reload
await page.goto(qUrl, { waitUntil: 'networkidle' });
await page.click('button:has-text("My Answer")');
const restored = await page.locator('textarea').first().inputValue();
log(restored === marker, `personal answer restored after import (${restored === marker})`);

// 4. Refreshing the question bank preserves the personal answer (criteria #8)
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await page.click('button:has-text("Refresh question bank")');
await page.click('div[role="dialog"] button:has-text("Refresh")');
await page.waitForTimeout(1200);
await page.goto(qUrl, { waitUntil: 'networkidle' });
await page.click('button:has-text("My Answer")');
const afterReset = await page.locator('textarea').first().inputValue();
log(afterReset === marker, `personal answer preserved after refreshing the bank (${afterReset === marker})`);

await browser.close();
if (errors.length) { console.log('\nErrors:'); errors.slice(0,8).forEach(e=>console.log('  - '+e)); }
console.log(process.exitCode ? '\nSETTINGS SMOKE FAILED' : '\nSETTINGS SMOKE PASSED');
