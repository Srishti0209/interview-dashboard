// Checks src/lib/pdfLayout.ts: PDF text is rebuilt in reading order from
// positions (two-column resumes, titles beside dates), not content order.
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
let failed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}\n  ${e.message}`);
  }
};
// Rough width at 8pt: 4.4 units per character.
const at = (str, x, y, h = 8) => ({ str, x, y, width: str.length * 4.4, height: h });

try {
  const { layoutPage, findGutter } = await vite.ssrLoadModule('/src/lib/pdfLayout.ts');
  const W = 595;

  // Main column (x 30–360) and a sidebar (x 400+), listed in a scrambled
  // content order: titles and companies last, like real resume builders.
  const twoCol = [
    // Bullets wrap at the column edge (~360), as real body text does.
    at('• Led the checkout migration across four brands without downtime', 30, 700),
    at('and moved every brand to the new framework, phase by phase', 30, 688),
    at('SKILLS', 400, 760),
    at('• React • TypeScript', 400, 748),
    at('• Node • GraphQL', 400, 736),
    at('• Jest • Playwright', 400, 724),
    at('• AWS • Docker', 400, 712),
    at('• Built the reconciliation service that replaced manual matching', 30, 640),
    at('• Mentored two engineers through their first on-call rotations', 30, 676),
    at('• Automated the monthly finance reports end to end', 30, 628),
    at('STRENGTHS', 400, 700),
    at('Collaborative and eager to share', 400, 688),
    // Sidebars run down the page alongside the main column.
    at('Adaptable and keen to learn', 400, 676),
    at('LANGUAGES', 400, 662),
    at('English, Hindi', 400, 650),
    at('Senior Engineer', 30, 725),
    at('2021 - Present', 300, 725),
    at('Shopwise', 30, 713),
    at('London, UK', 310, 713),
    at('Engineer', 30, 665),
    at('2018 - 2021', 305, 665),
    at('Ledgerly', 30, 653),
  ];

  test('finds the sidebar gutter', () => {
    const g = findGutter(twoCol, W);
    assert.ok(g !== null && g > 360 && g < 400, `gutter ${g}`);
  });
  const text = layoutPage(twoCol, W);
  const lines = text.split('\n').filter(Boolean);
  test('title and dates stay on one line', () => assert.ok(lines.includes('Senior Engineer | 2021 - Present'), text));
  test('company sits under its title', () =>
    assert.equal(lines[lines.indexOf('Senior Engineer | 2021 - Present') + 1], 'Shopwise | London, UK'));
  test('bullets follow their own job', () => {
    const job1 = lines.indexOf('Senior Engineer | 2021 - Present');
    const job2 = lines.indexOf('Engineer | 2018 - 2021');
    const bullet = lines.indexOf('• Led the checkout migration across four brands without downtime');
    assert.ok(job1 < bullet && bullet < job2, text);
    assert.ok(lines.indexOf('• Built the reconciliation service that replaced manual matching') > job2, text);
  });
  test('sidebar comes after the main column, not interleaved', () => {
    assert.ok(lines.indexOf('SKILLS') > lines.indexOf('• Built the reconciliation service that replaced manual matching'), text);
    assert.ok(lines.indexOf('STRENGTHS') > lines.indexOf('SKILLS'), text);
  });

  const oneCol = [
    at('Experience', 40, 760),
    at('A long paragraph line that runs most of the way across the page width', 40, 740),
    at('and wraps onto a second line of similar length across the page', 40, 728),
    at('Senior Engineer', 40, 700),
    at('2021 - Present', 480, 700),
    at('3', 295, 30),
  ];
  test('single-column page has no gutter (page number ignored)', () => assert.equal(findGutter(oneCol, W), null));
  test('single-column page reads top to bottom', () => {
    const t = layoutPage(oneCol, W).split('\n').filter(Boolean);
    assert.deepEqual(t.slice(0, 2), ['Experience', 'A long paragraph line that runs most of the way across the page width']);
    assert.ok(t.includes('Senior Engineer | 2021 - Present'));
  });
  test('aligned "Label      : value" lines get no separator', () => {
    const t = layoutPage([at('Scripting', 40, 700), at(': Shell Script', 140, 700), at('Languages', 40, 688), at(': JavaScript', 140, 688)], W);
    assert.deepEqual(t.split('\n'), ['Scripting : Shell Script', 'Languages : JavaScript']);
  });
  // Client/dates labels in a narrow column beside role details, two roles
  // with no blank row between them, then a table.
  const roles = [
    at('Client : Verizon', 220, 720),
    at('Jan 2020 – Present', 220, 710),
    ...['Role: Senior developer', 'Project: Kiosk store app', 'Technology: React, Redux', '• Built reusable components', '• Improved web performance'].map((t, i) => at(t, 320, 720 - i * 10)),
    at('Client : CITI Bank', 220, 670),
    at('Dec 2016 – Dec 2017', 220, 660),
    ...['Role: Developer', 'Project: iPad sales app', 'Technology: jQuery', '• Gathered requirements', '• Fixed production issues'].map((t, i) => at(t, 320, 670 - i * 10)),
    at('Class', 220, 590), at('Year', 380, 590), at('Grade', 480, 590),
    at('B.Tech', 220, 580), at('2015', 380, 580), at('77%', 480, 580),
    at('XII', 220, 570), at('2010', 380, 570), at('87%', 480, 570),
    at('X', 220, 560), at('2008', 380, 560), at('89%', 480, 560),
  ];
  const r = layoutPage(roles, W).split('\n').filter(Boolean);
  test('each client/date label is read with its own role (labels at the top)', () => {
    assert.deepEqual(r.slice(0, 3), ['Client : Verizon', 'Jan 2020 – Present', 'Role: Senior developer']);
    const citi = r.indexOf('Client : CITI Bank');
    assert.ok(citi > r.indexOf('• Improved web performance'), r.join('\n'));
    assert.equal(r[citi + 2], 'Role: Developer', r.join('\n'));
  });
  test('each label is read with its own role (labels centred, roles spaced apart)', () => {
    const centred = [
      at('Client : ALTIS', 220, 700),
      at('2018 – 2019', 220, 690),
      ...['Role: Senior developer', 'Project: WebRTC platform', 'Technology: React', '• Designed the prototype', '• Built server APIs'].map((t, i) => at(t, 320, 715 - i * 10)),
      at('Client : CITI Bank', 220, 645),
      at('2016 – 2017', 220, 635),
      // 14pt between roles, 10pt within one
      ...['Role: Developer', 'Project: iPad sales app', 'Technology: jQuery', '• Gathered requirements', '• Fixed production issues'].map((t, i) => at(t, 320, 661 - i * 10)),
    ];
    const c = layoutPage(centred, W).split('\n').filter(Boolean);
    const citi = c.indexOf('Client : CITI Bank');
    assert.ok(citi > c.indexOf('• Built server APIs') && c[citi + 2] === 'Role: Developer', c.join('\n'));
  });
  test('a table reads row by row', () => {
    assert.ok(r.includes('B.Tech | 2015 | 77%') && r.includes('XII | 2010 | 87%'), r.join('\n'));
  });
  test('split words on one line are joined with a space', () => {
    const t = layoutPage([at('Hello', 40, 700), at('world', 40 + 5 * 4.4 + 3, 700)], W);
    assert.equal(t, 'Hello world');
  });

  // Icon fonts (phone/pin/star glyphs) draw only single characters.
  const withIcons = [
    { ...at('E', 40, 760), fontName: 'icons' },
    { ...at('44-7466187355', 52, 760), fontName: 'body' },
    { ...at('t', 40, 740), fontName: 'icons' },
    { ...at('Collaborative', 52, 740), fontName: 'body' },
    { ...at('\uE02A', 40, 720), fontName: 'icons' },
    { ...at('Leadership', 52, 720), fontName: 'body' },
    { ...at('•', 40, 700), fontName: 'bullets' },
    { ...at('Shipped the redesign', 52, 700), fontName: 'body' },
  ];
  const iconText = layoutPage(withIcons, W);
  test('icon-font glyphs are dropped', () =>
    assert.deepEqual(iconText.split('\n').filter(Boolean), ['44-7466187355', 'Collaborative', 'Leadership', '• Shipped the redesign']));
  test('unmapped glyphs show as a visible marker, not nothing', () => {
    const t = layoutPage([at('with 7', 40, 700), { ...at('\u0000', 40 + 6 * 4.4, 700), width: 5 }, at('years', 40 + 6 * 4.4 + 5, 700)], W);
    assert.ok(t.includes('7\uFFFD'), JSON.stringify(t));
  });

  // Unmapped glyph recovery (src/lib/pdfGlyphs.ts)
  const { resolveUnmapped } = await vite.ssrLoadModule('/src/lib/pdfGlyphs.ts');
  const run = (text, font = 'body', widths = {}) =>
    [...text].map((ch) => ({ font, unicode: ch, width: widths[ch] ?? 500 }));
  const missing = (w, font = 'body') => ({ font, unicode: '\u0000', width: w });
  const resolve = (parts) => resolveUnmapped(parts.flat());
  test('a glyph as wide as the hyphen between digits becomes "-"', () => {
    const W = { '-': 460 };
    assert.deepEqual(resolve([run('auto-approve 8', 'body', W), missing(460), run('10 sites', 'body', W)]), ['-']);
  });
  test('a glyph after numbers and before a space becomes "+"', () => {
    assert.deepEqual(resolve([run('with 7'), missing(659), run(' years and 15'), missing(659), run(' projects')]), ['+', '+']);
  });
  test('between letters, the ligature that makes a known word', () => {
    assert.deepEqual(resolve([run('improved e'), missing(847), run('ciency')]), ['ffi']);
    assert.deepEqual(resolve([run('a speci'), missing(600), run('c goal')]), ['fi']);
  });
  test('two different unmapped glyphs in one font are resolved separately', () => {
    const W = { '-': 460 };
    assert.deepEqual(resolve([run('7', 'body', W), missing(659), run(' years, 8', 'body', W), missing(460), run('10 a-b', 'body', W)]), ['+', '-']);
  });
  test('unclear glyphs stay unresolved instead of guessing', () => {
    assert.deepEqual(resolve([run('hello '), missing(300), run(' world')]), [null]);
    assert.deepEqual(resolve([run('xq'), missing(800), run('zz')]), [null]);
  });
} finally {
  await vite.close();
}
console.log(failed ? `\n${failed} failed` : '\nAll passed');
process.exit(failed ? 1 : 0);
