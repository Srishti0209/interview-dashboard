// Admin panel (needs migration 0005):
//  1. non-admins: no Admin link, /admin is a 404, and the database refuses
//     their writes to shared questions
//  2. admins: create a draft (hidden from the Question Bank), publish it
//     (appears), edit it (marked admin_edited), move to draft (hidden again)
//  3. history: each change is versioned; restoring an old version works
//  4. bin: binning hides it but keeps users' answers; restore brings it back;
//     "Delete forever" removes it and those answers
// The smoke account is made admin for the run and put back afterwards.
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
/** REST as the service role (bypasses RLS): for setup, checks and cleanup. */
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
const TITLE = `SMOKE admin question ${Date.now()}`;
const cleanup = async () => {
  await serviceRest(`questions?title=like.SMOKE%20admin%20question*&owner_id=is.null`, { method: 'DELETE' });
  await serviceRest(`content_versions?entity=eq.question&snapshot->>title=like.SMOKE%20admin%20question*`, { method: 'DELETE' });
};
const row = async () => (await serviceRest(`questions?title=eq.${encodeURIComponent(TITLE)}&select=*`))[0];

await cleanup();
await setAdmin(false);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, { viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

/** Whether the Question Bank (search by title) lists the test question. */
async function inBank() {
  await page.goto(BASE + '/questions');
  await page.getByPlaceholder(/Search title/).fill(TITLE);
  await page.waitForTimeout(800);
  return (await page.getByText(TITLE).count()) > 0;
}

try {
  // 1. Not an admin.
  await page.goto(BASE + '/admin');
  await page.getByText("That page doesn't exist.").waitFor({ timeout: 15000 });
  log(true, 'non-admin: /admin shows not found');
  log((await page.locator('aside').getByRole('link', { name: 'Admin' }).count()) === 0, 'non-admin: no Admin link');
  const [shared] = await serviceRest('questions?owner_id=is.null&select=id,title&limit=1');
  const blocked = await rest(`questions?id=eq.${shared.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: shared.title }),
  });
  log(Array.isArray(blocked) && blocked.length === 0, 'non-admin: database refuses edits to shared questions');

  // 2. Admin.
  await setAdmin(true);
  await page.goto(BASE + '/');
  await page.locator('aside').getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('heading', { name: 'Admin: question bank' }).waitFor({ timeout: 15000 });
  const count = await page.getByTestId('admin-count').innerText();
  log(/^\d+ of \d+ questions$/.test(count) && !count.startsWith('0 '), `admin: list loads (${count})`);

  await page.getByRole('link', { name: 'New question' }).click();
  await page.getByRole('button', { name: 'Create question' }).click();
  log(await page.getByText('Pick at least one role.').isVisible(), 'missing fields are flagged');
  await page.getByLabel('Title').fill(TITLE);
  await page.getByPlaceholder(/The question as the interviewer asks it/).fill('Prompt written by the admin smoke test.');
  await page.getByPlaceholder(/The model answer/).fill('First answer from the admin smoke test.');
  await page.getByRole('button', { name: 'Frontend Engineer' }).click();
  await page.getByRole('button', { name: 'Create question' }).click();
  await page.getByText('Saved as a draft.').waitFor({ timeout: 15000 });
  log(/\/admin\/questions\/[0-9a-f-]{36}$/.test(page.url()), 'draft created');
  let r = await row();
  log(r?.review_status === 'draft' && r.admin_edited && r.source === 'seed' && r.owner_id === null, 'saved as a shared draft, marked edited');
  const editUrl = page.url();
  log(!(await inBank()), 'draft hidden from the Question Bank');

  await page.goto(editUrl);
  await page.getByLabel('Published').click();
  await page.getByPlaceholder(/The model answer/).fill('Updated answer from the admin smoke test.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Saved and live for users.').waitFor({ timeout: 15000 });
  r = await row();
  log(r.review_status === 'approved' && r.answer === 'Updated answer from the admin smoke test.', 'published with the edited answer');
  log(await inBank(), 'published question appears in the Question Bank');

  await page.goto(editUrl);
  await page.getByRole('button', { name: 'Move to draft (hide)' }).click();
  await page.getByText('Saved as a draft.').waitFor({ timeout: 15000 });
  log(!(await inBank()), '"Move to draft" hides it again');

  // 3. History.
  await page.goto(editUrl);
  const versions = page.getByTestId('version');
  await versions.first().waitFor({ timeout: 15000 });
  log((await versions.count()) >= 2, `history lists earlier versions (${await versions.count()})`);
  const first = versions.last(); // oldest: the draft as first created
  await first.getByRole('button', { name: 'View' }).click();
  log(await first.getByText('First answer from the admin smoke test.').isVisible(), 'an old version can be viewed');
  await first.getByRole('button', { name: 'Restore' }).click();
  await page.getByText('Saved as a draft.').waitFor({ timeout: 15000 });
  r = await row();
  log(r.answer === 'First answer from the admin smoke test.', 'restoring a version puts its content back');

  // 4. Bin. Publish again and give the smoke user an answer on it first.
  await page.getByLabel('Published').click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Saved and live for users.').waitFor({ timeout: 15000 });
  await rest('user_question_state', {
    method: 'POST',
    body: JSON.stringify({ question_id: r.id, personal_answer: 'My answer, kept through the bin.' }),
  });
  const myAnswer = async () => (await serviceRest(`user_question_state?question_id=eq.${r.id}&select=personal_answer`))[0]?.personal_answer;

  await page.getByRole('button', { name: 'Move to bin' }).click();
  await page.getByRole('heading', { name: 'Admin: question bank' }).waitFor({ timeout: 15000 });
  r = await row();
  log(r.deleted_at !== null, 'moved to the bin');
  log((await myAnswer()) === 'My answer, kept through the bin.', "users' answers are kept while it's in the bin");
  log(!(await inBank()), 'binned question hidden from the Question Bank');
  await page.goto(BASE + '/admin');
  await page.getByRole('tab', { name: /^Bin/ }).click();
  log(await page.getByTestId('admin-row').filter({ hasText: TITLE }).isVisible(), 'shown in the Bin tab');

  await page.goto(editUrl);
  await page.getByTestId('in-bin').getByRole('button', { name: 'Restore' }).click();
  await page.getByTestId('in-bin').waitFor({ state: 'detached', timeout: 15000 });
  log(await inBank(), 'restored question is back in the Question Bank');

  await page.goto(editUrl);
  await page.getByRole('button', { name: 'Move to bin' }).click();
  await page.getByRole('heading', { name: 'Admin: question bank' }).waitFor({ timeout: 15000 });
  await page.goto(editUrl);
  await page.getByTestId('in-bin').getByRole('button', { name: 'Delete forever' }).click();
  await page.getByRole('heading', { name: 'Admin: question bank' }).waitFor({ timeout: 15000 });
  log(!(await row()) && (await myAnswer()) === undefined, '"Delete forever" removes it and the answers on it');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await cleanup();
  await setAdmin(false);
  log(true, 'smoke account is no longer admin; test questions removed');
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
