// Sign-in page: password option works through the real form (no injected
// session), wrong password shows a clear error, sign out returns here.
// Account page: setting a password (a temporary one; SMOKE_PASSWORD is put
// back through the admin API afterwards, even on failure). Google button: shown only when Google is enabled, with the
// auth settings mocked both ways.
// Does not send magic-link emails (Supabase's built-in email is rate limited).
import { chromium } from 'playwright';
import './lib/auth.mjs'; // loads .env.local
import { getSmokeSession, setSmokeProfile } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

await setSmokeProfile(); // onboarded, so a successful sign-in shows the app

const { user } = await getSmokeSession();
if (!user.email.endsWith('@interview-prep.test')) throw new Error('Refusing to change the password of a real account');
const TEMP_PASSWORD = process.env.SMOKE_PASSWORD + '-temp';
const restorePassword = () =>
  fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: process.env.SMOKE_PASSWORD }),
  });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

try {
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).waitFor({ timeout: 15000 });
  log((await page.getByLabel('Password').count()) === 0, 'email link is the default (no password field)');

  await page.getByRole('button', { name: 'Sign in with a password instead' }).click();
  log(await page.getByLabel('Password').isVisible(), 'password option reveals a password field');

  await page.getByLabel('Email').fill(process.env.SMOKE_EMAIL);
  await page.getByLabel('Password').fill('definitely-wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Wrong email or password').waitFor({ timeout: 10000 });
  log(true, 'wrong password shows a clear error');

  await page.getByLabel('Password').fill(process.env.SMOKE_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 });
  log(true, 'correct password signs in and opens the app');

  await page.reload();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 });
  log(true, 'session survives a reload');

  await page.goto(BASE + '/account');
  const setPassword = page.getByRole('button', { name: 'Set password' });
  await setPassword.waitFor({ timeout: 15000 });
  await page.getByLabel('New password').fill('short');
  log(await setPassword.isDisabled(), 'password under 8 characters cannot be set');
  await page.getByLabel('New password').fill(TEMP_PASSWORD);
  await page.getByLabel('Confirm password').fill(TEMP_PASSWORD + 'x');
  log(
    (await page.getByText("Passwords don't match").isVisible()) && (await setPassword.isDisabled()),
    'mismatched confirmation is flagged',
  );
  await page.getByLabel('Confirm password').fill(TEMP_PASSWORD);
  await setPassword.click();
  await page.getByText('Password set. You can now sign in with it.').waitFor({ timeout: 10000 });
  log(true, 'password set from the Account page');

  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.getByRole('button', { name: 'Email me a sign-in link' }).waitFor({ timeout: 10000 });
  log(true, 'sign out returns to the sign-in page');

  await page.getByRole('button', { name: 'Sign in with a password instead' }).click();
  await page.getByLabel('Email').fill(process.env.SMOKE_EMAIL);
  await page.getByLabel('Password').fill(TEMP_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Account' }).waitFor({ timeout: 15000 });
  log(true, 'the newly set password signs in');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.getByRole('button', { name: 'Email me a sign-in link' }).waitFor({ timeout: 10000 });

  await page.getByRole('button', { name: 'Sign in with a password instead' }).click();
  await page.getByRole('button', { name: 'Email me a sign-in link instead' }).click();
  log((await page.getByLabel('Password').count()) === 0, 'can switch back to email link');

  // Google button, with the project's auth settings mocked.
  for (const enabled of [false, true]) {
    const gPage = await (await browser.newContext()).newPage();
    gPage.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    await gPage.route('**/auth/v1/settings', (route) =>
      route.fulfill({ json: { external: { email: true, google: enabled } } }),
    );
    await gPage.route('**/auth/v1/authorize**', (route) => route.abort());
    await gPage.goto(BASE + '/');
    await gPage.getByRole('button', { name: 'Email me a sign-in link' }).waitFor({ timeout: 15000 });
    await gPage.waitForTimeout(500);
    const google = gPage.getByRole('button', { name: 'Continue with Google' });
    if (!enabled) {
      log((await google.count()) === 0, 'no Google button while Google is disabled');
    } else {
      log(await google.isVisible(), 'Google button shown once Google is enabled');
      const authorize = gPage.waitForRequest((r) => r.url().includes('/auth/v1/authorize'));
      await google.click();
      const url = new URL((await authorize).url());
      log(
        url.searchParams.get('provider') === 'google' && url.searchParams.get('redirect_to') === BASE,
        'Google button starts Google sign-in and returns to the app',
      );
    }
    await gPage.context().close();
  }
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  log((await restorePassword()).ok, 'smoke account password restored');
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
