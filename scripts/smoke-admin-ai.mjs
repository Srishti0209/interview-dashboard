// Admin AI usage and limits (api/admin/ai; needs migration 0006):
//  1. non-admins: the API refuses (403) and /admin/ai is a 404
//  2. admins see calls and estimated cost by person and feature, priced per
//     model (rows without a model use the task's default model)
//  3. limits set in the panel apply straight away (checked through the
//     AI status endpoint): app-wide limit, a per-person override, "No limits"
// Seeds ai_usage rows for the smoke account; removes them and any limits
// afterwards, and puts the account's admin flag back.
import { chromium } from 'playwright';
import { getSmokeSession, newSignedInContext, url } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const session = await getSmokeSession();
const { user } = session;
if (!user.email.endsWith('@interview-prep.test') || process.env.SMOKE_ACCOUNT_IS_DISPOSABLE !== 'yes') {
  throw new Error('Refusing to run against a real account');
}
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const serviceRest = async (path, init = {}) => {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: svc });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
const setAdmin = (on) =>
  serviceRest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ is_admin: on }) });
const asUser = (path, method = 'GET', body) =>
  fetch(`${BASE}/api/${path}`, {
    method,
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
const jdLeft = async () => (await (await asUser('ai/status')).json()).remaining.jd;
const cleanup = async () => {
  await serviceRest(`ai_usage?user_id=eq.${user.id}`, { method: 'DELETE' });
  await serviceRest(`ai_limit_overrides?user_id=eq.${user.id}`, { method: 'DELETE' });
  await serviceRest('app_settings?key=eq.ai_limits', { method: 'DELETE' });
};

await cleanup();
await setAdmin(false);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, { viewport: { width: 1280, height: 1600 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));

try {
  // 1. Not an admin.
  log((await asUser('admin/ai?days=7')).status === 403, 'non-admin: usage report refused (403)');
  log((await asUser('admin/ai', 'POST', { settings: { off: true } })).status === 403, 'non-admin: changing limits refused (403)');
  await page.goto(BASE + '/admin/ai');
  await page.getByText("That page doesn't exist.").waitFor({ timeout: 15000 });
  log(true, 'non-admin: /admin/ai shows not found');

  // 2. Seed usage: two Sonnet job analyses ($0.04 each) and one resume read
  // with no model logged (Haiku by default: $0.0105). Total ≈ $0.09.
  await serviceRest('ai_usage', {
    method: 'POST',
    body: JSON.stringify([
      { user_id: user.id, endpoint: 'jd:gaps', tokens_in: 10000, tokens_out: 2000, model: 'claude-sonnet-5-5' },
      { user_id: user.id, endpoint: 'jd:gaps', tokens_in: 10000, tokens_out: 2000, model: 'claude-sonnet-5-5' },
      { user_id: user.id, endpoint: 'resume:read', tokens_in: 100000, tokens_out: 1000, model: null },
    ]),
  });
  log((await jdLeft()) === 3, 'default limit applies: 3 of 5 job analyses left');

  await setAdmin(true);
  await page.goto(BASE + '/admin/ai');
  const byUser = page.getByTestId('ai-by-user');
  await byUser.locator('tr', { hasText: user.email }).waitFor({ timeout: 15000 });
  const mine = await byUser.locator('tr', { hasText: user.email }).innerText();
  log(/\b3\b/.test(mine) && mine.includes('$0.09'), `by person: 3 calls, $0.09 (${mine.replace(/\s+/g, ' ')})`);
  const jd = await page.getByTestId('ai-by-feature').locator('tr', { hasText: 'Job analysis' }).innerText();
  log(/\b2\b/.test(jd) && jd.includes('$0.08'), 'by feature: job analysis 2 calls, $0.08');
  log((await page.getByTestId('ai-by-day').locator('tbody tr').count()) >= 1, 'by day listed');

  // 3. Limits.
  const limits = page.getByTestId('ai-limits');
  await limits.getByLabel('Job analyses').fill('2');
  await limits.getByRole('button', { name: 'Save limits' }).click();
  await limits.getByText('Saved. Applies to the next AI call.').waitFor({ timeout: 10000 });
  log((await jdLeft()) === 0, 'app-wide limit of 2 applies at once: none left');

  const overrides = page.getByTestId('ai-overrides');
  await overrides.getByLabel('Person').selectOption({ label: user.email });
  await overrides.getByLabel('Job analyses').fill('5');
  await overrides.getByRole('button', { name: 'Save for this person' }).click();
  await overrides.getByTestId('ai-override').filter({ hasText: user.email }).waitFor({ timeout: 10000 });
  log((await jdLeft()) === 3, 'per-person override of 5 wins: 3 left');
  await overrides.getByTestId('ai-override').filter({ hasText: user.email }).getByRole('button', { name: 'Remove' }).click();
  await overrides.getByTestId('ai-override').waitFor({ state: 'detached', timeout: 10000 });
  log((await jdLeft()) === 0, 'removing the override goes back to the app-wide limit');

  await page.getByTestId('ai-limits').getByLabel('No limits').click();
  await page.getByTestId('ai-limits').getByRole('button', { name: 'Save limits' }).click();
  await page.getByTestId('ai-limits').getByText('Saved. Applies to the next AI call.').waitFor({ timeout: 10000 });
  log((await jdLeft()) > 1000, '"No limits" removes the cap');

  const bad = await asUser('admin/ai', 'POST', { settings: { limits: { jd: -1 } } });
  log(bad.status === 400, 'invalid limits are rejected');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await cleanup();
  await setAdmin(false);
  log((await jdLeft()) === 5, 'cleaned up: limits back to defaults, smoke account not admin');
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
