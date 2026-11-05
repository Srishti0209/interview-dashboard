// Admin users page (api/admin/users):
//  1. non-admins: the API refuses (403) and /admin/users is a 404
//  2. admins: everyone is listed with their target role and activity counts
//  3. make a (throwaway) user admin and remove it again; admins can't change
//     their own access
// The smoke account is made admin for the run and put back afterwards; the
// throwaway user is deleted.
import { chromium } from 'playwright';
import { getSmokeSession, newSignedInContext, rest, url } from './lib/auth.mjs';

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
const setAdmin = (id, on) =>
  serviceRest(`profiles?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_admin: on }) });
const api = (method, body) =>
  fetch(`${BASE}/api/admin/users`, {
    method,
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });

// A throwaway account to grant and remove admin on.
const TEMP_EMAIL = `smoke-temp-${Date.now()}@interview-prep.test`;
const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: svc,
  body: JSON.stringify({ email: TEMP_EMAIL, password: crypto.randomUUID(), email_confirm: true }),
}).then((r) => r.json());
const tempId = created.id;

await setAdmin(user.id, false);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, { viewport: { width: 1280, height: 1200 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

try {
  // 1. Not an admin.
  log((await api('GET')).status === 403, 'non-admin: listing users is refused (403)');
  log((await api('POST', { userId: tempId, isAdmin: true })).status === 403, 'non-admin: granting admin is refused (403)');
  await page.goto(BASE + '/admin/users');
  await page.getByText("That page doesn't exist.").waitFor({ timeout: 15000 });
  log(true, 'non-admin: /admin/users shows not found');

  // Some activity for the smoke user: one practised question, one answer.
  const qs = await serviceRest('questions?owner_id=is.null&review_status=eq.approved&select=id&limit=2');
  await rest('user_question_state', {
    method: 'POST',
    body: JSON.stringify([
      { question_id: qs[0].id, review_count: 2, next_due: Date.now(), personal_answer: null },
      { question_id: qs[1].id, review_count: 0, next_due: null, personal_answer: 'An answer.' },
    ]),
  });

  // 2. Admin.
  await setAdmin(user.id, true);
  await page.goto(BASE + '/admin/users');
  const rows = page.getByTestId('user-row');
  await rows.first().waitFor({ timeout: 15000 });
  log((await rows.count()) >= 2, `everyone is listed (${await page.getByTestId('users-count').innerText()})`);
  const mine = rows.filter({ hasText: user.email });
  const mineText = await mine.innerText();
  log(mineText.includes('(you)') && mineText.includes('Admin'), 'own row marked "(you)" and Admin');
  log(/Preparing for Senior Frontend Engineer/.test(mineText), 'shows the target role');
  log(/1\s*Questions practised/.test(mineText) && /1\s*Answers written/.test(mineText), 'shows activity counts');
  log(!mineText.includes('An answer.'), "doesn't show anyone's answer text");
  log((await mine.getByRole('button', { name: /admin/i }).count()) === 0, "can't change your own admin access here");
  const self = await api('POST', { userId: user.id, isAdmin: false });
  log(self.status === 400, "the API also refuses changing your own access");

  // 3. Grant and remove admin on the throwaway user.
  await page.getByLabel('Search users').fill(TEMP_EMAIL);
  const temp = rows.filter({ hasText: TEMP_EMAIL });
  await temp.getByRole('button', { name: 'Make admin' }).click();
  await temp.getByRole('button', { name: 'Remove admin' }).waitFor({ timeout: 15000 });
  let [p] = await serviceRest(`profiles?id=eq.${tempId}&select=is_admin`);
  log(p.is_admin === true, 'Make admin grants admin');
  await temp.getByRole('button', { name: 'Remove admin' }).click();
  await temp.getByRole('button', { name: 'Make admin' }).waitFor({ timeout: 15000 });
  [p] = await serviceRest(`profiles?id=eq.${tempId}&select=is_admin`);
  log(p.is_admin === false, 'Remove admin removes it');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await setAdmin(user.id, false);
  const del = await fetch(`${url}/auth/v1/admin/users/${tempId}`, { method: 'DELETE', headers: svc });
  log(del.ok, 'smoke account is no longer admin; throwaway user deleted');
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
