// PWA verification against the production build (vite preview):
// SW registers, manifest is valid, app works offline after first load.
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:5183';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) process.exitCode = 1; }

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Dashboard', { timeout: 15000 });
log(true, 'production build boots to Dashboard');

// manifest present + valid
const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
log(!!manifestHref, `manifest linked: ${manifestHref}`);
const manifest = await page.evaluate(async (href) => {
  const r = await fetch(href);
  return r.ok ? await r.json() : null;
}, manifestHref);
log(
  manifest && manifest.name && manifest.icons?.length >= 2 && manifest.start_url,
  `manifest valid (name="${manifest?.name}", ${manifest?.icons?.length} icons, display=${manifest?.display})`,
);
log(
  manifest?.icons?.some((i) => i.purpose === 'maskable'),
  'manifest has a maskable icon',
);

// service worker registers + becomes ready
const swReady = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  return !!reg.active;
});
log(swReady, 'service worker registered and active');

// seed data present (criteria #1)
await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=/of 161 questions/', { timeout: 10000 });
log(true, 'question bank seeded in production build');

// OFFLINE: cut the network and reload — must still boot (offline-first)
await ctx.setOffline(true);
await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForSelector('text=Dashboard', { timeout: 15000 });
log(true, 'app boots OFFLINE after first load');
// offline deep link via SW navigateFallback
await page.goto(`${BASE}/questions`, { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForSelector('text=Question Bank', { timeout: 10000 });
log(true, 'offline deep-link to /questions works (SW navigate fallback)');
await ctx.setOffline(false);

await browser.close();
if (errors.length) {
  console.log('\nErrors (some offline fetch errors are expected):');
  errors.slice(0, 8).forEach((e) => console.log('  - ' + e));
}
console.log(process.exitCode ? '\nPWA SMOKE FAILED' : '\nPWA SMOKE PASSED');
