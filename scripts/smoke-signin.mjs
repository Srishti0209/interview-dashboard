// Sign-in page: password option works through the real form (no injected
// session), wrong password shows a clear error, sign out returns here.
// Does not send magic-link emails (Supabase's built-in email is rate limited).
import { chromium } from 'playwright';
import './lib/auth.mjs'; // loads .env.local
import { setSmokeProfile } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

await setSmokeProfile(); // onboarded, so a successful sign-in shows the app

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

  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.getByRole('button', { name: 'Email me a sign-in link' }).waitFor({ timeout: 10000 });
  log(true, 'sign out returns to the sign-in page');

  await page.getByRole('button', { name: 'Sign in with a password instead' }).click();
  await page.getByRole('button', { name: 'Email me a sign-in link instead' }).click();
  log((await page.getByLabel('Password').count()) === 0, 'can switch back to email link');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
