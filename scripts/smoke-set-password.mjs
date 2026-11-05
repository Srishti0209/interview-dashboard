// New users who sign in by email link: "Create a password" → onboarding →
// Dashboard. Uses a real magic-link session made with the admin API
// (generate_link + verify), so no email is sent.
//  1. password step shown first; too-short / mismatched passwords blocked
//  2. setting it continues to onboarding, then the Dashboard; the password
//     signs in and the step isn't shown again
//  3. "Skip for now" goes straight to onboarding
//  4. no password step after a password sign-in (covered by smoke-onboarding)
// Restores SMOKE_PASSWORD and the finished profile afterwards.
import { chromium } from 'playwright';
import { getSmokeSession, setSmokeProfile, storageKey, url, key } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const { user } = await getSmokeSession();
if (!user.email.endsWith('@interview-prep.test') || process.env.SMOKE_ACCOUNT_IS_DISPOSABLE !== 'yes') {
  throw new Error('Refusing to run against a real account');
}
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = (path, body, method = 'POST') =>
  fetch(`${url}/auth/v1/${path}`, {
    method,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
    return r.json();
  });
const updateUser = (body) => admin(`admin/users/${user.id}`, body, 'PUT');

/** A session exactly as an emailed sign-in link would create it. */
async function magicLinkSession() {
  const link = await admin('admin/generate_link', { type: 'magiclink', email: user.email });
  const token_hash = link.hashed_token ?? link.properties?.hashed_token;
  const res = await fetch(`${url}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash }),
  });
  if (!res.ok) throw new Error(`verify: ${res.status} ${await res.text()}`);
  const s = await res.json();
  return { ...s, expires_at: s.expires_at ?? Math.floor(Date.now() / 1000) + s.expires_in };
}

async function newUserPage(browser) {
  await updateUser({ user_metadata: { password_set: false } });
  await setSmokeProfile({
    onboarded: false,
    current_position: null,
    target_role_family: null,
    target_level: null,
  });
  const session = await magicLinkSession();
  const ctx = await browser.newContext();
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [storageKey(), JSON.stringify(session)]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto(BASE + '/');
  return page;
}

const TEMP_PASSWORD = process.env.SMOKE_PASSWORD + '-new';
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  // 1–2. Set a password, then onboarding, then the Dashboard.
  let page = await newUserPage(browser);
  await page.getByRole('heading', { name: 'Create a password' }).waitFor({ timeout: 15000 });
  log(true, 'email-link sign-in starts with "Create a password"');
  const cont = page.getByRole('button', { name: 'Continue' });
  await page.getByLabel('New password').fill('short');
  log(await cont.isDisabled(), 'too-short password blocked');
  await page.getByLabel('New password').fill(TEMP_PASSWORD);
  await page.getByLabel('Confirm password').fill(TEMP_PASSWORD + 'x');
  log(await cont.isDisabled(), 'mismatched confirmation blocked');
  await page.getByLabel('Confirm password').fill(TEMP_PASSWORD);
  await cont.click();

  await page.getByText('What is your current role?').waitFor({ timeout: 15000 });
  log(true, 'then the onboarding flow');
  await page.getByLabel('Current role').fill('Tech Lead');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /^Full Stack Engineer/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: 'Senior Full Stack Engineer' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Add your resume (optional)').waitFor();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 });
  log(true, 'and lands on the Dashboard');

  const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: TEMP_PASSWORD }),
  });
  const signedIn = signIn.ok ? await signIn.json() : null;
  log(!!signedIn, 'the new password signs in');
  log(signedIn?.user?.user_metadata?.password_set === true, 'account marked as having a password');

  await page.reload();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 });
  log((await page.getByRole('heading', { name: 'Create a password' }).count()) === 0, 'password step not shown again');
  await page.context().close();

  // 3. Skip.
  page = await newUserPage(browser);
  await page.getByRole('heading', { name: 'Create a password' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByText('What is your current role?').waitFor({ timeout: 15000 });
  log(true, '"Skip for now" goes straight to onboarding');
  await page.context().close();
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await updateUser({ password: process.env.SMOKE_PASSWORD, user_metadata: { password_set: false } })
    .then(() => log(true, 'smoke account password restored'))
    .catch((e) => log(false, 'restoring password failed: ' + e.message));
  await setSmokeProfile();
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
