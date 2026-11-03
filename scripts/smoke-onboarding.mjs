// Accounts phase 2: onboarding, account page, resume upload paths.
//  1. new user → 4-step onboarding (current role, target role, level, resume)
//  2. paste fallback enforces the minimum length, saves, profile persisted
//  3. account page: change role (PO has no Staff level), save persists
//  4. replace resume via TXT, PDF and DOCX uploads (text extracted, file stored)
//  5. scanned/blank PDF → "paste instead" notice; unsupported type rejected
//  6. reload keeps you past onboarding; sign out returns to sign-in
import { chromium } from 'playwright';
import JSZip from 'jszip';
import {
  newSignedInContext,
  setSmokeProfile,
  getSmokeSession,
  rest,
  readAppCache,
  url,
  key,
  SMOKE_PROFILE,
} from './lib/auth.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182';
const errors = [];

function log(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const LONG_TEXT = Array.from(
  { length: 12 },
  (_, i) =>
    `Line ${i + 1}: Led a team of engineers shipping payments features, cut p95 latency by 40% and owned the on-call rota.`,
).join('\n');

// --- fixture files --------------------------------------------------------
function textPdf(lines) {
  const content =
    'BT /F1 10 Tf 72 740 Td 14 TL ' +
    lines.map((l) => `(${l.replace(/[()\\]/g, '')}) Tj T*`).join(' ') +
    ' ET';
  return buildPdf(
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    content,
  );
}
function blankPdf() {
  return buildPdf('<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>', '');
}
function buildPdf(pageDict, stream) {
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    pageDict,
    `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}
async function docx(paragraphs) {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('') +
      '</w:body></w:document>',
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

// --- cleanup --------------------------------------------------------------
async function cleanup() {
  await setSmokeProfile({ ...SMOKE_PROFILE, active_resume_id: null });
  const rows = await rest('resumes?select=id,storage_path');
  const paths = rows.map((r) => r.storage_path).filter(Boolean);
  if (paths.length) {
    const { access_token } = await getSmokeSession();
    await fetch(`${url}/storage/v1/object/resumes`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: paths }),
    });
  }
  if (rows.length) await rest('resumes?id=not.is.null', { method: 'DELETE' });
}

const profile = async () => (await rest('profiles?select=*'))[0];
const resumes = async () => rest('resumes?select=*&order=created_at.asc');

await cleanup();
await setSmokeProfile({
  onboarded: false,
  current_position: null,
  target_role_family: null,
  target_level: null,
  active_resume_id: null,
});

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await newSignedInContext(browser, {}, { onboarded: false });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

try {
  // 1. Onboarding
  await page.goto(BASE + '/');
  await page.getByText('What is your current role?').waitFor({ timeout: 15000 });
  log(true, 'new user lands on onboarding');

  const cont = page.getByRole('button', { name: 'Continue' });
  log(await cont.isDisabled(), 'Continue disabled until current role entered');
  await page.getByLabel('Current role').fill('Tech Lead');
  await cont.click();

  await page.getByText('Which role are you preparing for?').waitFor();
  const cards = await page.getByRole('radio').allTextContents();
  log(
    ['Product Owner', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'AI Engineer'].every((r) =>
      cards.some((c) => c.startsWith(r)),
    ),
    'all 5 target role families offered',
  );
  await page.getByRole('radio', { name: /^Backend Engineer/ }).click();
  await cont.click();

  await page.getByText('At what level?').waitFor();
  const levels = await page.getByRole('radio').allTextContents();
  log(
    levels.join('|') === 'Backend Engineer|Senior Backend Engineer|Staff Backend Engineer',
    `backend levels: ${levels.join(', ')}`,
  );
  await page.getByRole('radio', { name: 'Staff Backend Engineer' }).click();
  await cont.click();

  // 2. Resume step via paste fallback
  await page.getByText('Add your resume (optional)').waitFor();
  await page.getByRole('button', { name: 'Paste resume text instead' }).click();
  await page.getByLabel('Resume text').fill('too short');
  log(await page.getByRole('button', { name: 'Save resume' }).isDisabled(), 'short pasted text cannot be saved');
  await page.getByLabel('Resume text').fill(LONG_TEXT);
  await page.getByRole('button', { name: 'Save resume' }).click();

  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 });
  log(true, 'finishing onboarding opens the dashboard');

  let p = await profile();
  let rs = await resumes();
  log(
    p.onboarded && p.current_position === 'Tech Lead' && p.target_role_family === 'backend' && p.target_level === 'staff',
    'profile saved (Tech Lead → Staff Backend Engineer)',
  );
  log(rs.length === 1 && rs[0].storage_path === null && p.active_resume_id === rs[0].id, 'pasted resume saved and active');
  log(
    (await page.getByText('Preparing for Staff Backend Engineer').count()) > 0,
    'sidebar shows target role',
  );

  // 3. Account page: change role
  await page.goto(BASE + '/account');
  await page.getByText('Pasted resume text').waitFor({ timeout: 15000 });
  log(true, 'account page shows active resume');
  await page.getByRole('radio', { name: /^Product Owner/ }).click();
  log((await page.getByRole('radio', { name: 'Staff Product Owner' }).count()) === 0, 'Product Owner has no Staff level');
  log(
    await page.getByRole('button', { name: 'Save changes' }).isDisabled(),
    'cannot save until a valid level is picked',
  );
  await page.getByRole('radio', { name: 'Senior Product Owner' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Saved — preparing for Senior Product Owner').waitFor();
  log((await page.getByText('Preparing for Senior Product Owner', { exact: true }).count()) === 1, 'sidebar updates to new role immediately');
  p = await profile();
  log(p.target_role_family === 'product_owner' && p.target_level === 'senior', 'role change persisted');

  // 4. Replace resume with TXT, PDF, DOCX uploads
  const uploads = [
    { name: 'resume.txt', mimeType: 'text/plain', buffer: Buffer.from(LONG_TEXT) },
    { name: 'resume.pdf', mimeType: 'application/pdf', buffer: textPdf(LONG_TEXT.split('\n')) },
    {
      name: 'resume.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: await docx(LONG_TEXT.split('\n')),
    },
  ];
  for (const file of uploads) {
    await page.getByRole('button', { name: 'Replace resume' }).click();
    await page.getByTestId('resume-file').setInputFiles(file);
    await page.getByText('Does this look right?').waitFor({ timeout: 20000 });
    const extracted = await page.getByLabel('Resume text').inputValue();
    log(extracted.includes('cut p95 latency by 40%') && extracted.length >= 300, `${file.name}: text extracted (${extracted.length} chars)`);
    await page.getByRole('button', { name: 'Save resume' }).click();
    // The saved card (not the review screen's "Text read from …" hint).
    await page.getByRole('button', { name: 'Replace resume' }).waitFor({ timeout: 15000 });
    log(await page.getByText(file.name, { exact: true }).isVisible(), `${file.name}: shown as active resume`);
    p = await profile();
    rs = await resumes();
    const active = rs.find((r) => r.id === p.active_resume_id);
    log(active?.file_name === file.name && active.storage_path?.startsWith(p.id + '/'), `${file.name}: stored and active`);
  }
  log((await resumes()).length === 4, 'older resume versions kept');

  // 5. Scanned/blank PDF and unsupported type
  await page.getByRole('button', { name: 'Replace resume' }).click();
  await page.getByTestId('resume-file').setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: blankPdf() });
  await page.getByText("couldn't read much text").waitFor({ timeout: 20000 });
  log(true, 'blank/scanned PDF shows paste-instead notice');
  log(await page.getByRole('button', { name: 'Save resume' }).isDisabled(), 'empty extraction cannot be saved');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByTestId('resume-file').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('x') });
  log(await page.getByText('Please upload a PDF, DOCX or TXT file.').isVisible(), 'unsupported file type rejected');
  await page.getByRole('button', { name: 'Cancel' }).click();

  // 6. Reload + sign out
  await page.reload();
  await page.getByRole('heading', { name: 'Account' }).waitFor({ timeout: 15000 });
  log((await page.getByText('What is your current role?').count()) === 0, 'reload stays past onboarding');
  await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Email me a sign-in link' }).waitFor({ timeout: 10000 });
  log(true, 'sign out returns to sign-in page');
  await page.waitForTimeout(800);
  const cache = await readAppCache(page);
  log(!cache.includes('"profile"') && !cache.includes('"resume"'), 'sign out clears cached account data from the device');
} catch (e) {
  log(false, 'unexpected failure: ' + e.message);
} finally {
  await browser.close();
  await cleanup();
}

log(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
