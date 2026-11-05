// Recovers characters for PDF glyphs that have no Unicode mapping (pdf.js
// gives them as NUL). Some resume builders embed fonts whose ToUnicode table
// leaves out contextual alternates and ligatures, e.g. the "+" in "7+", the
// hyphen in "8-10" or the "ffi" in "efficiency". The file never says what
// they are, so each unmapped glyph is resolved from clues:
//   1. width: same advance width as a mapped symbol in the same font
//      (an alternate hyphen is exactly as wide as the hyphen)
//   2. ligatures: between letters, the f-ligature that makes known words
//   3. context: after a number, before a space → "+"; between digits → "-"
// A glyph that no rule settles stays unresolved (shown as � for the user).

/** One glyph as drawn, in content order (from pdf.js's operator list). */
export interface DrawnGlyph {
  font: string;
  /** Glyph code within the font, when pdf.js provides it. */
  code?: number;
  /** pdf.js's character for it: '\u0000' when unmapped. */
  unicode: string;
  /** Advance width in 1/1000 em. */
  width: number;
}

const LIGATURES = ['ffi', 'ffl', 'ff', 'fi', 'fl'];
const SYMBOLS = /^[-–—+/&.,:;()%#*'’"“”!?]$/;

// Common words (resume vocabulary) containing f-ligatures, used to pick the
// ligature that makes a real word.
const LIGATURE_WORDS = new Set(
  `affect affected afford affordable benefit benefits certified classification config configuration configure confirm conflict conflicts difficult differ different difference diffs effect effective effectively effectiveness effects efficiencies efficiency efficient efficiently effort efforts fifteen fifty file files filter filters final finally finance financial find finding findings fine finish finished first fit fix fixed fixes fixing flag flags flagship flaw flexibility flexible flight flights float flow flows fluent focus identified identifier identify influence influenced inflow insufficient justified modified notification notifications offer offered offering offerings offers office officer offices official offline offset offshore profile profiles profit profitability qualification qualified refactor reflect reflected scaffold scaffolding significant significantly simplified simplify specific specifically specification specifications staff staffing stuff sufficient traffic unified verification verified workflow workflows`.split(' '),
);

const isDigit = (c: string | undefined) => !!c && /[0-9]/.test(c);
const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);

interface Occurrence {
  key: string;
  before: string;
  after: string;
}

/** The whitespace-delimited word around an occurrence, with `fill` in place. */
function wordWith(o: Occurrence, fill: string): string {
  const left = o.before.match(/\p{L}*$/u)?.[0] ?? '';
  const right = o.after.match(/^\p{L}*/u)?.[0] ?? '';
  return (left + fill + right).toLowerCase();
}

/**
 * For each unmapped glyph in `glyphs` (in order), the recovered character(s),
 * or null where no rule is confident.
 */
export function resolveUnmapped(glyphs: DrawnGlyph[]): (string | null)[] {
  // Widths of mapped characters per font.
  const widths = new Map<string, Map<string, number>>();
  for (const g of glyphs) {
    if (g.unicode && g.unicode !== '\u0000' && [...g.unicode].length === 1) {
      const byChar = widths.get(g.font) ?? new Map<string, number>();
      byChar.set(g.unicode, g.width);
      widths.set(g.font, byChar);
    }
  }

  // Every occurrence of each unmapped glyph, with nearby text for context.
  const occurrences: Occurrence[] = [];
  const byKey = new Map<string, { glyph: DrawnGlyph; occ: Occurrence[] }>();
  glyphs.forEach((g, i) => {
    if (g.unicode !== '\u0000') return;
    const around = (from: number, to: number) =>
      glyphs
        .slice(Math.max(0, from), Math.max(0, to))
        .map((x) => (x.unicode === '\u0000' ? '�' : x.unicode))
        .join('');
    // Without a glyph code, the width tells different glyphs apart.
    const id = g.code ?? `w${g.width.toFixed(2)}`;
    const occ: Occurrence = { key: `${g.font}:${id}`, before: around(i - 20, i), after: around(i + 1, i + 21) };
    occurrences.push(occ);
    const entry = byKey.get(occ.key) ?? { glyph: g, occ: [] };
    entry.occ.push(occ);
    byKey.set(occ.key, entry);
  });

  const resolved = new Map<string, string | null>();
  for (const [key, { glyph, occ }] of byKey) {
    const fontWidths = widths.get(glyph.font) ?? new Map<string, number>();

    // 1. Same width as a mapped symbol in this font.
    const sameWidth = [...fontWidths].filter(
      ([ch, w]) => SYMBOLS.test(ch) && Math.abs(w - glyph.width) <= Math.max(1, glyph.width * 0.005),
    );
    if (sameWidth.length === 1) {
      resolved.set(key, sameWidth[0][0]);
      continue;
    }

    const betweenLetters = occ.filter((o) => isLetter(o.before.at(-1)) || isLetter(o.after[0]));
    // 2. Ligature: the candidate that turns these words into known words.
    if (betweenLetters.length === occ.length) {
      const scored = LIGATURES.map((lig) => ({
        lig,
        hits: occ.filter((o) => LIGATURE_WORDS.has(wordWith(o, lig))).length,
      })).sort((a, b) => b.hits - a.hits);
      resolved.set(key, scored[0].hits > 0 && scored[0].hits > (scored[1]?.hits ?? 0) ? scored[0].lig : null);
      continue;
    }

    // 3. Context after numbers.
    const plus = occ.every((o) => isDigit(o.before.at(-1)) && !isDigit(o.after[0]));
    const range = occ.every((o) => isDigit(o.before.at(-1)) && isDigit(o.after[0]));
    resolved.set(key, plus ? '+' : range ? '-' : null);
  }

  return occurrences.map((o) => resolved.get(o.key) ?? null);
}
