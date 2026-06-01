// Phase 6 smoke: create a note, type content, insert code/math/mermaid via
// slash, link a question, verify persistence + bidirectional link.
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}
const slash = async (term) => {
  await page.keyboard.type('/');
  await page.waitForTimeout(150);
  await page.keyboard.type(term);
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
};

await page.goto(`${BASE}/notes`, { waitUntil: 'networkidle' });
// create a note (button in empty state or sidebar +)
const newBtn = page.locator('button:has-text("New note")').first();
if (await newBtn.count()) await newBtn.click();
else await page.locator('aside button').last().click();
await page.waitForSelector('.tiptap', { timeout: 10000 });
const title = 'SMOKE NOTE ' + Date.now();
await page.fill('input[placeholder="Untitled note"]', title);
log(true, 'created a note and set title');

// type a heading + paragraph
const editor = page.locator('.tiptap');
await editor.click();
await page.keyboard.type('Intro paragraph about closures.');
await page.keyboard.press('Enter');

// code block
await slash('code');
await page.keyboard.type('const x = 1;');
await page.keyboard.press('ArrowDown'); // exit code block via trailing node
await page.waitForTimeout(150);
log((await page.locator('.tiptap pre').count()) > 0, 'inserted a code block');

// mermaid
await slash('mermaid');
await page.waitForTimeout(800); // mermaid dynamic import + render
const mermaidOk = (await page.locator('.tiptap [data-type="mermaid"]').count()) > 0;
log(mermaidOk, 'inserted a mermaid block');

// math block (search by keyword without spaces; slash has allowSpaces:false)
await editor.click();
await page.keyboard.press('End');
await page.keyboard.press('Enter');
await slash('equation');
await page.waitForTimeout(300);
log((await page.locator('.tiptap .katex').count()) > 0, 'inserted a math block (KaTeX rendered)');

// question reference (opens picker dialog)
await editor.click();
await page.keyboard.press('Enter');
await slash('question');
await page.waitForSelector('text=Link a question', { timeout: 5000 });
await page.locator('button:has-text("Search questions") , input[placeholder="Search questions…"]');
await page.locator('div[role="dialog"] button').nth(1).click();
await page.waitForTimeout(400);
const refOk = (await page.locator('.tiptap [data-question-id]').count()) > 0;
log(refOk, 'inserted a question reference card');

// wait for autosave
await page.waitForTimeout(2300);

// read note id + linkedQuestionIds from IndexedDB
const noteData = await page.evaluate(async (t) => {
  const req = indexedDB.open('InterviewPrep');
  return await new Promise((resolve) => {
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const all = store.getAll();
      all.onsuccess = () => {
        const note = all.result.find((n) => n.title === t);
        resolve(note ? { id: note.id, linked: note.linkedQuestionIds } : null);
      };
    };
  });
}, title);
log(!!noteData, `note persisted (id ${noteData?.id?.slice(0, 8)})`);
log(noteData?.linked?.length >= 1, `linkedQuestionIds populated: ${JSON.stringify(noteData?.linked)}`);

// reload -> content persists
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.tiptap pre', { timeout: 10000 });
log(true, 'code block persisted across reload');
log((await page.locator('.tiptap [data-question-id]').count()) > 0, 'question ref persisted across reload');

// bidirectional: question detail shows the linked note
const qid = noteData.linked[0];
await page.goto(`${BASE}/questions/${qid}`, { waitUntil: 'networkidle' });
await page.waitForSelector('text=Linked notes', { timeout: 8000 });
const backlink = await page.locator(`text=${title}`).count();
log(backlink > 0, 'question detail shows the note as a backlink (bidirectional)');

// search finds the note
await page.goto(`${BASE}/notes`, { waitUntil: 'networkidle' });
await page.fill('input[placeholder="Search notes…"]', title.slice(0, 12));
await page.waitForTimeout(400);
log((await page.locator(`aside :text("${title}")`).count()) > 0, 'note found via sidebar search');

await browser.close();
if (errors.length) {
  console.log('\nErrors:');
  errors.slice(0, 12).forEach((e) => console.log('  - ' + e));
  process.exitCode = 1;
} else console.log('\nNo console/page errors.');
console.log(process.exitCode ? '\nPHASE 6 SMOKE FAILED' : '\nPHASE 6 SMOKE PASSED');
