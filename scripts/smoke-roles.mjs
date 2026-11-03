// The question bank, its round-type filters, the mock-interview round picker
// and the add-question form all follow the user's target role.
import { chromium } from 'playwright';
import { newSignedInContext, setSmokeProfile, SMOKE_PROFILE } from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const PO_ROUNDS = [
  'Behavioral / Bar Raiser',
  'Product Sense',
  'Prioritisation & Roadmap',
  'Stakeholders & Agile Delivery',
  'Metrics & Analytics',
  'Technical Fluency',
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const ctx = await newSignedInContext(browser);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  const sidebarRounds = async () => {
    await page.goto(`${BASE}/questions`, { waitUntil: 'networkidle' });
    const group = page.locator('aside', { hasText: 'Filters' }).first();
    await group.getByText('Round type').waitFor();
    return group.locator('label').allInnerTexts();
  };

  // Product Owner
  await setSmokeProfile({ ...SMOKE_PROFILE, target_role_family: 'product_owner', target_level: 'senior' });
  let labels = (await sidebarRounds()).map((l) => l.trim());
  log(PO_ROUNDS.slice(0, 5).every((r) => labels.includes(r)), 'PO filters list the PO rounds');
  log(!labels.includes('JS Fundamentals') && !labels.includes('React & Framework'), 'PO filters hide engineering rounds');

  await page.goto(`${BASE}/mock`, { waitUntil: 'networkidle' });
  const mockRounds = (await page.locator('label:has(button[role="checkbox"])').allInnerTexts()).map((l) => l.trim());
  log(mockRounds.length > 0 && mockRounds.every((r) => PO_ROUNDS.includes(r)), `PO mock picker: ${mockRounds.join(', ')}`);
  const checked = await page.locator('label:has(button[role="checkbox"][data-state="checked"])').count();
  log(checked === 3, `3 PO rounds pre-selected for a mock (${checked})`);

  await page.goto(`${BASE}/my-questions/new`, { waitUntil: 'networkidle' });
  const roundSelect = page.locator('button[role="combobox"]').first();
  const defaultRound = (await roundSelect.innerText()).trim();
  log(PO_ROUNDS.includes(defaultRound), `add-question defaults to a PO round (${defaultRound})`);

  // Frontend
  await setSmokeProfile(SMOKE_PROFILE);
  labels = (await sidebarRounds()).map((l) => l.trim());
  log(labels.includes('JS Fundamentals') && labels.includes('React & Framework'), 'frontend filters list engineering rounds');
  log(!labels.includes('Product Sense') && !labels.includes('Metrics & Analytics'), 'frontend filters hide PO rounds');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await setSmokeProfile(SMOKE_PROFILE);
  await browser.close();
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
