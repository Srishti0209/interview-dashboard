// Rebuilds readable text from a PDF page's positioned text items. PDF content
// order often isn't reading order: two-column resumes come out with the
// sidebar interleaved, or job titles detached from their bullets. So we
// find a vertical gutter (if any), then read each column top to bottom.

export interface PdfTextItem {
  str: string;
  /** Left edge and baseline in PDF units (y grows upwards). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** pdf.js font id; used to spot icon fonts. */
  fontName?: string;
}

/** Shown in place of glyphs the PDF gives no character for. */
export const UNREADABLE = '\uFFFD';
const BULLETS = /^[•·▪◦‣○●■□–\-*]$/;
// Private Use Area: icon fonts map their symbols here.
const PRIVATE_USE = /[\uE000-\uF8FF]/g;

/**
 * Fonts that only ever draw one or two characters (phone, pin and star
 * icons). Their glyphs come out as stray letters ("E 44-…", "t Collaborative").
 */
function iconFonts(items: PdfTextItem[]): Set<string> {
  const byFont = new Map<string, string[]>();
  for (const it of items) {
    if (!it.fontName) continue;
    const list = byFont.get(it.fontName) ?? [];
    list.push(it.str.replaceAll('\u0000', '').trim());
    byFont.set(it.fontName, list);
  }
  const icons = new Set<string>();
  for (const [font, strs] of byFont) {
    const visible = strs.filter(Boolean);
    if (
      visible.length <= 30 &&
      visible.every((s) => s.length <= 2) &&
      !visible.every((s) => BULLETS.test(s))
    ) {
      icons.add(font);
    }
  }
  return icons;
}

const BIN = 2; // gutter search resolution, in PDF units
const MIN_GUTTER = 6;

const sameLine = (a: PdfTextItem, b: PdfTextItem) =>
  Math.abs(a.y - b.y) <= Math.max(2, Math.min(a.height, b.height) * 0.5);

/** Distinct baselines among items. */
function lineCount(items: PdfTextItem[]): number {
  const ys: PdfTextItem[] = [];
  for (const it of [...items].sort((a, b) => b.y - a.y)) {
    if (!ys.length || !sameLine(ys[ys.length - 1], it)) ys.push(it);
  }
  return ys.length;
}

/** Share of the region's height that has text on this side. */
function verticalCoverage(side: PdfTextItem[], bottom: number, top: number): number {
  const spans = side
    .map((it) => [it.y - it.height * 0.25, it.y + it.height] as const)
    .sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let end = -Infinity;
  for (const [from, to] of spans) {
    if (to <= end) continue;
    covered += to - Math.max(from, end);
    end = to;
  }
  return top > bottom ? covered / (top - bottom) : 0;
}

/**
 * Candidate column gutters within [x0, x1]: vertical strips no text crosses,
 * widest first, each with the items on either side.
 */
function gutters(items: PdfTextItem[], x0: number, x1: number, minWidth = MIN_GUTTER) {
  const bins = Math.ceil((x1 - x0) / BIN) + 1;
  const covered = new Uint16Array(bins);
  for (const it of items) {
    const from = Math.max(0, Math.floor((it.x - x0) / BIN));
    const to = Math.min(bins - 1, Math.floor((it.x + it.width - x0) / BIN));
    for (let b = from; b <= to; b++) covered[b]++;
  }
  // Ignore the outer 15%: margins aren't gutters.
  const lo = Math.floor(((x1 - x0) * 0.15) / BIN);
  const hi = Math.ceil(((x1 - x0) * 0.85) / BIN);
  const out: { x: number; width: number; left: PdfTextItem[]; right: PdfTextItem[] }[] = [];
  let start = -1;
  for (let b = lo; b <= hi; b++) {
    if (covered[b] === 0 && b < hi) {
      if (start === -1) start = b;
    } else if (start !== -1) {
      if ((b - start) * BIN >= minWidth) {
        const x = x0 + (start + (b - start) / 2) * BIN;
        out.push({
          x,
          width: (b - start) * BIN,
          left: items.filter((it) => it.x < x),
          right: items.filter((it) => it.x >= x),
        });
      }
      start = -1;
    }
  }
  return out.sort((a, b) => b.width - a.width);
}

const chars = (items: PdfTextItem[]) => items.reduce((n, it) => n + it.str.length, 0);

/**
 * True when two sides pair up row by row (a table, or "Title | dates" lines):
 * similar line counts and most lines of the shorter side share a baseline
 * with the other side. Such rows read better across than down.
 */
function pairsUp(left: PdfTextItem[], right: PdfTextItem[]): boolean {
  const [l, r] = [lineCount(left), lineCount(right)];
  if (Math.min(l, r) < Math.max(l, r) * 0.7) return false;
  const [small, other] = left.length <= right.length ? [left, right] : [right, left];
  const paired = small.filter((it) => other.some((o) => sameLine(o, it))).length;
  return paired >= small.length * 0.8;
}

/**
 * x of a full-height column gutter (a sidebar beside the main column): text
 * runs down most of the region on both sides. Footers and page numbers
 * don't count.
 */
export function findGutter(items: PdfTextItem[], pageWidth: number, x0 = 0): number | null {
  if (!items.length) return null;
  const bottom = Math.min(...items.map((it) => it.y - it.height * 0.25));
  const top = Math.max(...items.map((it) => it.y + it.height));
  const total = chars(items);
  for (const g of gutters(items, x0, pageWidth)) {
    if (chars(g.left) < total * 0.05 || chars(g.right) < total * 0.05) continue;
    if (lineCount(g.left) < 4 || lineCount(g.right) < 4) continue;
    if (pairsUp(g.left, g.right)) continue;
    if (
      // Real sidebars and main columns cover ~65–85% of the page height;
      // a sparse label column (client/dates) covers much less.
      verticalCoverage(g.left, bottom, top) >= 0.55 &&
      verticalCoverage(g.right, bottom, top) >= 0.55
    ) {
      return g.x;
    }
  }
  return null;
}

/**
 * x of a gutter between two columns inside one block, e.g. a short client
 * and dates column beside a role description. Not used for rows that pair
 * up line by line ("Title | dates", tables), which read better across.
 */
function findBlockGutter(items: PdfTextItem[]): number | null {
  const x0 = Math.min(...items.map((it) => it.x));
  const x1 = Math.max(...items.map((it) => it.x + it.width));
  // Columns inside a block sit closer together than page columns.
  for (const g of gutters(items, x0, x1, 4)) {
    if (lineCount(g.left) < 2 || lineCount(g.right) < 2) continue;
    if (!pairsUp(g.left, g.right)) return g.x;
  }
  return null;
}

/** Splits items into horizontal bands at blank rows wider than normal leading. */
function bands(items: PdfTextItem[]): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y);
  const out: PdfTextItem[][] = [];
  let current: PdfTextItem[] = [];
  let floor = Infinity; // lowest text bottom in the current band
  for (const it of sorted) {
    const top = it.y + it.height;
    if (current.length && floor - top > it.height * 0.6) {
      out.push(current);
      current = [];
      floor = Infinity;
    }
    current.push(it);
    floor = Math.min(floor, it.y - it.height * 0.25);
  }
  if (current.length) out.push(current);
  return out;
}

/**
 * Recursive XY-cut: full-height columns first, then horizontal bands, then
 * columns inside a band; anything left reads as plain lines.
 */
function cut(items: PdfTextItem[], pageWidth: number, depth: number): string {
  if (depth > 8 || items.length < 2) return readColumn(items);
  const x0 = Math.min(...items.map((it) => it.x));
  const x1 = Math.max(pageWidth, ...items.map((it) => it.x + it.width));
  const column = findGutter(items, x1, x0);
  if (column !== null) {
    return [
      cut(items.filter((it) => it.x < column), pageWidth, depth + 1),
      cut(items.filter((it) => it.x >= column), pageWidth, depth + 1),
    ].join('\n\n');
  }
  const parts = bands(items);
  if (parts.length > 1) return parts.map((b) => cut(b, pageWidth, depth + 1)).join('\n\n');
  const inner = findBlockGutter(items);
  if (inner !== null) return readBlock(items, inner);
  return readColumn(items);
}

/**
 * Reads a block split at `gutter`. When the narrow side has several separate
 * clusters (e.g. two client/date labels beside two role descriptions with no
 * blank row between them), the block is first cut between the clusters so
 * each label stays with its own text. The cut goes at the wide side's widest
 * line gap between the two labels (roles are usually spaced a little apart),
 * or, on a tie, just above where the lower label starts.
 */
function readBlock(items: PdfTextItem[], gutter: number): string {
  const left = items.filter((it) => it.x < gutter);
  const right = items.filter((it) => it.x >= gutter);
  const [narrow, wide] = lineCount(left) <= lineCount(right) ? [left, right] : [right, left];
  const clusters = bands(narrow);
  const wideLines = [...new Set(wide.map((it) => it.y))].sort((a, b) => b - a);
  const cuts: number[] = [];
  for (let i = 0; i + 1 < clusters.length; i++) {
    const upperBottom = Math.min(...clusters[i].map((it) => it.y));
    const lower = clusters[i + 1];
    const lowerTop = Math.max(...lower.map((it) => it.y + it.height));
    const candidates: { y: number; gap: number }[] = [];
    for (let j = 0; j + 1 < wideLines.length; j++) {
      const [above, below] = [wideLines[j], wideLines[j + 1]];
      // Any line break between the upper label's last line and the lower
      // label's last line (centred labels start below their role's top).
      if (below < upperBottom && above > Math.min(...lower.map((it) => it.y)) - 1) {
        candidates.push({ y: (above + below) / 2, gap: above - below });
      }
    }
    if (!candidates.length) {
      cuts.push((upperBottom + lowerTop) / 2);
      continue;
    }
    const widest = Math.max(...candidates.map((c) => c.gap));
    const best = candidates
      .filter((c) => c.gap >= widest * 0.9)
      .sort((a, b) => Math.abs(a.y - lowerTop) - Math.abs(b.y - lowerTop))[0];
    cuts.push(best.y);
  }
  const bounds = [Infinity, ...cuts, -Infinity];
  const out: string[] = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const inBand = (it: PdfTextItem) => it.y < bounds[i] && it.y >= bounds[i + 1];
    const label = readColumn(left.filter(inBand));
    const text = readColumn(right.filter(inBand));
    out.push([label, text].filter(Boolean).join('\n'));
  }
  return out.join('\n\n');
}

/** Reads items as lines, top to bottom, left to right. */
export function readColumn(items: PdfTextItem[]): string {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { y: number; height: number; items: PdfTextItem[] }[] = [];
  for (const it of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line.y - it.y) <= Math.max(2, Math.min(line.height, it.height) * 0.5)) {
      line.items.push(it);
    } else {
      lines.push({ y: it.y, height: it.height, items: [it] });
    }
  }

  const out: string[] = [];
  let prev: (typeof lines)[number] | undefined;
  for (const line of lines) {
    const parts = line.items.sort((a, b) => a.x - b.x);
    let text = '';
    let end = -Infinity;
    for (const it of parts) {
      const gap = it.x - end;
      // A wide gap separates columns of one line (title … dates), except
      // before punctuation: "Scripting      : Bash" is aligned labels.
      if (text && gap > it.height * 3 && !/^\s*[:;,.)]/.test(it.str)) text += ' | ';
      else if (text && gap > it.height * 0.15 && !/\s$/.test(text) && !/^\s/.test(it.str)) text += ' ';
      text += it.str;
      end = it.x + it.width;
    }
    // A clearly larger gap than normal line spacing starts a new paragraph.
    if (prev && prev.y - line.y > Math.max(prev.height, line.height) * 2) out.push('');
    out.push(text.trimEnd());
    prev = line;
  }
  return out.join('\n');
}

/** One page's text in reading order (columns, then blocks, then lines). */
export function layoutPage(items: PdfTextItem[], pageWidth: number): string {
  const icons = iconFonts(items);
  const text = items
    .filter((it) => !(it.fontName && icons.has(it.fontName) && !BULLETS.test(it.str.trim())))
    .map((it) => ({
      ...it,
      // Glyphs with no character mapping (e.g. "+" in "7+") come through as
      // NUL: keep a visible marker so the user can fix them before saving.
      str: it.str.replace(PRIVATE_USE, '').replaceAll('\u0000', UNREADABLE),
    }))
    .filter((it) => it.str.trim() && it.width >= 0);
  return cut(text, pageWidth, 0).replace(/\n{3,}/g, '\n\n');
}
