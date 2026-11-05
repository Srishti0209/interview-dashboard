// "Report a problem" and the admin feedback inbox (needs migration 0006):
//  1. a user reports a problem on a shared question; it's saved with its kind
//  2. non-admins can't read anyone's reports
//  3. admins see it in Admin → Feedback (badge counts open reports), can open
//     the question in the editor, mark it resolved and reopen it
// The smoke account is made admin for part 3 and put back afterwards.
import { chromium } from 'playwright';
import { getSmokeSession, newSignedInContext, rest, url } from './lib/auth.mjs';

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
const serviceRest = async (path, init = {}) => {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
const setAdmin = (on) =>
  serviceRest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ is_admin: on }) });
const cleanup = () => serviceRest(`question_feedback?user_id=eq.${user.id}`, { method: 'DELETE' });
const MESSAGE = `SMOKE feedback ${Date.now()}: the second key point has a typo.`;

await cleanup();
await setAdmin(false);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, { viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));

try {
  // 1. Report.
  const [shared] = await serviceRest(
    "questions?owner_id=is.null&review_status=eq.approved&role_families=cs.{frontend}&select=id,title&limit=1",
  );
  await page.goto(`${BASE}/questions/${shared.id}`);
  const report = page.getByRole('button', { name: 'Report a problem' });
  await report.waitFor({ timeout: 15000 });
  log(true, 'shared question offers "Report a problem"');
  await report.click();
  const send = page.getByRole('button', { name: 'Send report' });
  log(await send.isDisabled(), 'cannot send without details');
  await page.getByRole('button', { name: 'Typo or formatting' }).click();
  await page.getByLabel('Details').fill(MESSAGE);
  await send.click();
  await page.getByText('Thanks, your report has been sent.').waitFor({ timeout: 10000 });
  const [saved] = await serviceRest(`question_feedback?user_id=eq.${user.id}&select=*`);
  log(saved?.question_id === shared.id && saved.kind === 'typo' && saved.message === MESSAGE && !saved.resolved_at,
    'report saved with the question, kind and message');
  await page.getByRole('button', { name: 'Done' }).click();

  // 2. Not readable by non-admins.
  log((await rest('question_feedback?select=id')).length === 0, "non-admins can't read reports");

  // 3. Admin inbox.
  await setAdmin(true);
  await page.goto(BASE + '/');
  const adminLink = page.locator('aside').getByRole('link', { name: /^Admin/ });
  const badge = adminLink.locator('span[title$="open feedback reports"]');
  const badgeShown = await badge.waitFor({ timeout: 10000 }).then(() => true, () => false);
  log(badgeShown && /^\d+$/.test(await badge.innerText()), `sidebar Admin link shows open reports (${badgeShown ? await badge.innerText() : 'none'})`);
  await page.goto(BASE + '/admin/feedback');
  const item = page.getByTestId('feedback-item').filter({ hasText: MESSAGE });
  await item.waitFor({ timeout: 15000 });
  log(await item.getByText(shared.title).isVisible(), 'inbox shows the report with its question');
  log(await item.getByText('Typo or formatting').isVisible(), 'and its kind');

  await item.getByRole('button', { name: 'Mark resolved' }).click();
  await item.waitFor({ state: 'detached', timeout: 10000 });
  const [resolved] = await serviceRest(`question_feedback?id=eq.${saved.id}&select=resolved_at,resolved_by`);
  log(!!resolved.resolved_at && resolved.resolved_by === user.id, 'marked resolved (and by whom)');
  await page.getByRole('button', { name: 'Resolved' }).click();
  const done = page.getByTestId('feedback-item').filter({ hasText: MESSAGE });
  await done.getByRole('button', { name: 'Reopen' }).click();
  await done.waitFor({ state: 'detached', timeout: 10000 });
  log(!(await serviceRest(`question_feedback?id=eq.${saved.id}&select=resolved_at`))[0].resolved_at, 'reopened');

  await page.getByRole('button', { name: /^Open/ }).click();
  await page.getByTestId('feedback-item').filter({ hasText: MESSAGE }).getByRole('link', { name: 'Edit question' }).click();
  await page.waitForURL(`**/admin/questions/${shared.id}`);
  log(true, '"Edit question" opens it in the admin editor');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await cleanup();
  await setAdmin(false);
  log(true, 'smoke account is no longer admin; test reports removed');
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
