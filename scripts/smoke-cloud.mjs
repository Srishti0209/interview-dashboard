// Accounts phase 3: data lives in the account.
//  1. data saved in this browser by the local-first version imports into
//     the account (answers, reviews, notes, stories, applications, mocks,
//     custom questions, study days)
//  2. a second device (fresh browser) sees all of it
//  3. offline: edits apply instantly, the indicator counts queued changes,
//     and they sync when back online
//  4. server unreachable: a queued edit survives a reload and syncs after;
//     an edit followed by an instant reload is not lost
//  5. editing a note that changed on another device keeps the other version
import { chromium } from 'playwright';
import {
  newSignedInContext,
  questionsWithState,
  notes,
  rest,
  eventually,
} from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const SUPABASE = new URL(process.env.VITE_SUPABASE_URL).host;
const errors = [];
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}
const watch = (page) =>
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  // ---------- 1. Import local data ----------
  const ctxA = await newSignedInContext(browser);
  const a = await ctxA.newPage();
  watch(a);
  await a.goto(BASE + '/', { waitUntil: 'networkidle' });
  await a.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 });

  const seeded = await a.evaluate(async () => {
    const seed = await (await fetch('/seed/seed.json')).json();
    const { db } = await import('/src/lib/db.ts');
    const [q1, q2] = seed.questions;
    const company = seed.companies[0];
    const now = Date.now();
    await db.questions.bulkPut([
      ...seed.questions.map((q) =>
        q.id === q1.id ? { ...q, personalAnswer: 'LOCAL-ANSWER', bookmarked: true } : q,
      ),
      { ...q2, id: 'local-own-question', title: 'My local question', source: 'user' },
    ]);
    await db.reviewStates.put({
      questionId: q1.id, confidence: 3, lastReviewed: now, nextDue: now + 86400000,
      intervalDays: 1, easeFactor: 2.5, reviewCount: 2,
    });
    await db.notes.put({
      id: 'local-note', title: 'Local note',
      bodyJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'from this browser' }] }] },
      tags: [], linkedQuestionIds: [], createdAt: now, updatedAt: now,
    });
    await db.stories.bulkPut([
      // Test-only ids: story ids are unique across users, and real accounts
      // may already hold the seed ids.
      ...seed.stories.map((st) => ({ ...st, id: `local-${st.id}` })),
      { id: 'local-story', title: 'Local story', situation: 's', task: 't', action: 'a', result: 'r', metrics: '', applicableTo: [], tags: [] },
    ]);
    await db.companies.put({
      ...company, applicationStatus: 'applied', applicationNotes: 'Applied via referral',
      applicationDates: [{ stage: 'applied', date: now }],
    });
    await db.mockSessions.put({
      id: 'local-mock', startedAt: now - 3600000, endedAt: now, roundTypes: ['BEHAVIORAL_BAR_RAISER'], selfRating: 4,
    });
    localStorage.setItem('studyLog', JSON.stringify(['2026-10-01']));
    localStorage.removeItem('localImport:done');
    localStorage.removeItem('localImport:dismissed');
    return { q1: q1.id, companyId: company.id };
  });

  await a.reload({ waitUntil: 'networkidle' });
  const banner = a.getByRole('region', { name: 'Import local data' });
  await banner.waitFor({ timeout: 15000 });
  log(/1 answer/.test(await banner.innerText()), 'banner offers to import local data');
  await banner.getByRole('button', { name: 'Import' }).click();
  await a.getByText('Imported into your account').waitFor({ timeout: 20000 });
  log(true, 'import finished');

  const qs = await questionsWithState();
  const q1 = qs.find((q) => q.id === seeded.q1);
  log(q1?.personalAnswer === 'LOCAL-ANSWER' && q1.bookmarked, 'answer + bookmark imported');
  log(q1?.review?.reviewCount === 2, 'review state imported');
  log(qs.some((q) => q.id === 'local-own-question' && q.owner_id), 'custom question imported as yours');
  log((await notes()).some((n) => n.id === 'local-note'), 'note imported');
  log((await rest('stories?select=id')).some((s) => s.id === 'local-story'), 'stories imported');
  const app = (await rest(`user_company_state?company_id=eq.${seeded.companyId}&select=*`))[0];
  log(app?.application_status === 'applied' && app.application_notes === 'Applied via referral', 'application tracking imported');
  log((await rest('mock_sessions?select=id')).some((m) => m.id === 'local-mock'), 'mock session imported');
  log((await rest('study_days?select=day')).some((d) => d.day === '2026-10-01'), 'study days imported');

  await a.reload({ waitUntil: 'networkidle' });
  await a.getByRole('heading', { name: 'Dashboard' }).waitFor();
  log((await banner.count()) === 0, 'banner not shown again after import');

  // ---------- 2. Second device ----------
  const ctxB = await newSignedInContext(browser, {}, { reset: false });
  const b = await ctxB.newPage();
  watch(b);
  await b.goto(`${BASE}/questions/${seeded.q1}`, { waitUntil: 'networkidle' });
  await b.click('button:has-text("My Answer")');
  const answerBox = b.locator('textarea[placeholder*="your own words"]');
  log((await answerBox.inputValue()) === 'LOCAL-ANSWER', 'second device shows the answer');
  await b.goto(`${BASE}/notes/local-note`, { waitUntil: 'networkidle' });
  log(await b.getByText('from this browser').isVisible(), 'second device shows the note');
  await b.goto(`${BASE}/stories`, { waitUntil: 'networkidle' });
  log(await b.getByText('Local story').first().isVisible(), 'second device shows the story');

  // ---------- 3. Offline edits sync on reconnect ----------
  await b.goto(`${BASE}/questions/${seeded.q1}`, { waitUntil: 'networkidle' });
  await b.click('button:has-text("My Answer")');
  await ctxB.setOffline(true);
  await answerBox.fill('OFFLINE-EDIT');
  await b.locator('h1').click(); // blur flushes the autosave
  await b.click('button[title="Bookmark"]');
  const status = b.getByRole('status').filter({ hasText: 'Offline' }).first();
  await status.waitFor({ timeout: 5000 });
  const statusText = await status.innerText();
  log(/Offline · \d+ changes? waiting to sync/.test(statusText), `indicator: "${statusText}"`);
  log(await b.getByText('Saved on this device').isVisible(), 'save label says it is saved on this device');
  let server = (await questionsWithState()).find((q) => q.id === seeded.q1);
  log(server.personalAnswer === 'LOCAL-ANSWER', 'offline edit not on server yet');

  await ctxB.setOffline(false);
  server = (
    await eventually(questionsWithState, (all) =>
      all.find((q) => q.id === seeded.q1)?.personalAnswer === 'OFFLINE-EDIT',
    )
  ).find((q) => q.id === seeded.q1);
  log(server.personalAnswer === 'OFFLINE-EDIT' && server.bookmarked === false, 'offline edits synced after reconnecting (in order)');
  await b.waitForTimeout(500);
  log((await b.getByRole('status').filter({ hasText: /Offline|Syncing/ }).count()) === 0, 'indicator clears once synced');

  // ---------- 4. Queued edit survives a reload while the server is down ----------
  await b.route(`**://${SUPABASE}/**`, (route) => route.abort('internetdisconnected'));
  await b.click('button:has-text("My Answer")');
  await answerBox.fill('SURVIVES-RELOAD');
  await b.locator('h1').click();
  const outbox = () => b.evaluate(() => localStorage.getItem('sync-outbox') || '');
  const persisted = await eventually(outbox, (o) => o.includes('SURVIVES-RELOAD'));
  log(persisted.includes('SURVIVES-RELOAD'), 'queued edit saved on the device while server unreachable');
  await b.unroute(`**://${SUPABASE}/**`);
  await b.reload({ waitUntil: 'networkidle' });
  server = (
    await eventually(questionsWithState, (all) =>
      all.find((q) => q.id === seeded.q1)?.personalAnswer === 'SURVIVES-RELOAD',
    )
  ).find((q) => q.id === seeded.q1);
  log(server.personalAnswer === 'SURVIVES-RELOAD', 'queued edit synced after reload');
  log((await eventually(outbox, (o) => o === '')) === '', 'outbox empties once synced');

  // ---------- 4b. Edit immediately followed by a reload ----------
  await b.click('button:has-text("My Answer")');
  await answerBox.fill('RELOADED-INSTANTLY');
  await b.locator('h1').click();
  await b.reload(); // no waiting: the request is cut off mid-flight
  server = (
    await eventually(questionsWithState, (all) =>
      all.find((q) => q.id === seeded.q1)?.personalAnswer === 'RELOADED-INSTANTLY',
    )
  ).find((q) => q.id === seeded.q1);
  log(server.personalAnswer === 'RELOADED-INSTANTLY', 'edit survives an instant reload');

  // ---------- 5. Conflict keeps the other device's version ----------
  await b.goto(`${BASE}/notes/local-note`, { waitUntil: 'networkidle' });
  await b.getByText('from this browser').waitFor();
  await rest('notes?id=eq.local-note', {
    method: 'PATCH',
    body: JSON.stringify({
      body_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'EDITED ON OTHER DEVICE' }] }] },
      updated_at: Date.now() + 60_000,
    }),
  });
  await b.locator('.tiptap').click();
  await b.keyboard.press('End');
  await b.keyboard.type(' plus this device');
  const revisions = await eventually(
    () => rest('revisions?entity=eq.note&entity_id=eq.local-note&select=content'),
    (r) => r.length > 0,
    12000,
  );
  log(
    revisions.length > 0 && JSON.stringify(revisions[0].content).includes('EDITED ON OTHER DEVICE'),
    'other device\'s version kept as a revision',
  );
  const final = await eventually(
    () => rest('notes?id=eq.local-note&select=body_json'),
    (r) => JSON.stringify(r[0]?.body_json).includes('plus this device'),
  );
  log(JSON.stringify(final[0]?.body_json).includes('plus this device'), 'this device\'s edit saved');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
}
log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
