// Admin companies and playbooks editor (needs migration 0006):
//  1. non-admins: /admin/companies is a 404 and the database refuses edits
//  2. admins: create a draft company (hidden from the Companies page),
//     publish it (shown), add a playbook (shown once published), edit it and
//     restore an earlier version from its history
//  3. bin: hides the company but keeps users' tracking; restore; delete
//     forever removes it, its playbooks and that tracking
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
const NAME = `SMOKE Co ${Date.now()}`;
const cleanup = async () => {
  await serviceRest('companies?name=like.SMOKE%20Co*', { method: 'DELETE' });
  await serviceRest('content_versions?entity_id=like.smoke-co-*', { method: 'DELETE' });
};
const company = async () => (await serviceRest(`companies?name=eq.${encodeURIComponent(NAME)}&select=*`))[0];

await cleanup();
await setAdmin(false);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, { viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

/** Whether the user-facing Companies page lists the test company. */
async function onCompaniesPage() {
  await page.goto(BASE + '/companies');
  await page.waitForTimeout(1500);
  return (await page.getByText(NAME).count()) > 0;
}

try {
  // 1. Not an admin.
  await page.goto(BASE + '/admin/companies');
  await page.getByText("That page doesn't exist.").waitFor({ timeout: 15000 });
  log(true, 'non-admin: /admin/companies shows not found');
  const [any] = await serviceRest('companies?select=id,name&limit=1');
  const blocked = await rest(`companies?id=eq.${any.id}`, { method: 'PATCH', body: JSON.stringify({ name: any.name }) });
  log(Array.isArray(blocked) && blocked.length === 0, 'non-admin: database refuses edits to companies');

  // 2. Admin: create, publish, playbook.
  await setAdmin(true);
  await page.goto(BASE + '/admin/companies');
  await page.getByRole('heading', { name: 'Companies' }).waitFor({ timeout: 15000 });
  await page.getByTestId('admin-company-row').first().waitFor({ timeout: 15000 });
  log((await page.getByTestId('admin-company-row').count()) > 0, `admin: companies list loads (${await page.getByTestId('admin-company-row').count()})`);
  await page.getByRole('link', { name: 'New company' }).click();
  await page.getByRole('button', { name: 'Create company' }).click();
  log(await page.getByText('Add a name.').isVisible(), 'a name is required');
  await page.getByLabel('Name').fill(NAME);
  await page.getByLabel('Location').fill('London');
  await page.getByRole('button', { name: 'Add link' }).click();
  await page.getByLabel('Link 1 label').fill('Careers');
  await page.getByLabel('Link 1 URL').fill('https://example.com/careers');
  await page.getByRole('button', { name: 'Create company' }).click();
  await page.getByText('Saved as a draft.').waitFor({ timeout: 15000 });
  let c = await company();
  log(c && /\/admin\/companies\/smoke-co-\d+$/.test(page.url()) && c.review_status === 'draft' && c.admin_edited,
    `draft company created (${c?.id})`);
  log(c.links?.[0]?.url === 'https://example.com/careers', 'links saved');
  const editUrl = page.url();
  log(!(await onCompaniesPage()), 'draft company hidden from the Companies page');

  await page.goto(editUrl);
  await page.getByLabel('Published', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Save details' }).click();
  await page.getByText('Saved and live for users.').waitFor({ timeout: 15000 });
  log(await onCompaniesPage(), 'published company appears on the Companies page');

  await page.goto(editUrl);
  await page.getByRole('tab', { name: /^Frontend Engineer/ }).click();
  await page.getByPlaceholder(/The rounds, in order/).fill('SMOKE loop: phone screen, then onsite.');
  await page.locator('#pb-published').click();
  await page.getByRole('button', { name: 'Save Frontend Engineer playbook' }).click();
  await page.getByText('Saved and live for users.').waitFor({ timeout: 15000 });
  await page.goto(`${BASE}/companies/${c.id}`);
  await page.getByText('SMOKE loop: phone screen, then onsite.').waitFor({ timeout: 15000 });
  log(true, 'published playbook shown on the company page');

  // History: edit the playbook, then restore the first version.
  await page.goto(editUrl);
  await page.getByRole('tab', { name: /^Frontend Engineer/ }).click();
  await page.getByPlaceholder(/The rounds, in order/).fill('SMOKE loop v2: take-home only.');
  await page.getByRole('button', { name: 'Save Frontend Engineer playbook' }).click();
  await page.getByText('Saved and live for users.').waitFor({ timeout: 15000 });
  const history = page.getByTestId('history-playbook');
  await history.locator('summary').click();
  await history.getByTestId('version').first().waitFor({ timeout: 10000 });
  await history.getByTestId('version').first().getByRole('button', { name: 'Restore' }).click();
  await page.waitForTimeout(2000);
  const [pb] = await serviceRest(`company_playbooks?company_id=eq.${c.id}&role_family=eq.frontend&select=loop_structure`);
  log(pb.loop_structure === 'SMOKE loop: phone screen, then onsite.', 'restoring a playbook version puts it back');
  const details = page.getByTestId('history-company');
  log(/\((\d+)\)/.test(await details.locator('summary').innerText()) && !(await details.locator('summary').innerText()).includes('(0)'),
    'details history recorded');

  // 3. Bin.
  await rest('user_company_state', { method: 'POST', body: JSON.stringify({ company_id: c.id, application_status: 'applied' }) });
  const tracking = async () => (await serviceRest(`user_company_state?company_id=eq.${c.id}&select=application_status`))[0]?.application_status;
  await page.getByRole('button', { name: 'Move to bin' }).click();
  await page.getByRole('heading', { name: 'Companies' }).waitFor({ timeout: 15000 });
  c = await company();
  log(c.deleted_at !== null && (await tracking()) === 'applied', "moved to the bin; users' tracking kept");
  log(!(await onCompaniesPage()), 'binned company hidden from the Companies page');
  await page.goto(BASE + '/admin/companies');
  await page.getByRole('tab', { name: /^Bin/ }).click();
  log(await page.getByTestId('admin-company-row').filter({ hasText: NAME }).isVisible(), 'shown in the Bin tab');

  await page.goto(editUrl);
  await page.getByTestId('in-bin').getByRole('button', { name: 'Restore' }).click();
  await page.getByTestId('in-bin').waitFor({ state: 'detached', timeout: 15000 });
  log(await onCompaniesPage(), 'restored company is back');

  await page.goto(editUrl);
  await page.getByRole('button', { name: 'Move to bin' }).click();
  await page.getByRole('heading', { name: 'Companies' }).waitFor({ timeout: 15000 });
  await page.goto(editUrl);
  await page.getByTestId('in-bin').getByRole('button', { name: 'Delete forever' }).click();
  await page.getByRole('heading', { name: 'Companies' }).waitFor({ timeout: 15000 });
  const pbs = await serviceRest(`company_playbooks?company_id=eq.${c.id}&select=role_family`);
  log(!(await company()) && pbs.length === 0 && (await tracking()) === undefined,
    '"Delete forever" removes it, its playbooks and the tracking');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await cleanup();
  await setAdmin(false);
  log(true, 'smoke account is no longer admin; test companies removed');
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
