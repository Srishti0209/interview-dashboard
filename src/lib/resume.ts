import { supabase } from '@/lib/supabase';
import { layoutPage, type PdfTextItem } from '@/lib/pdfLayout';
import { resolveUnmapped, type DrawnGlyph } from '@/lib/pdfGlyphs';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { Resume } from '@/types';

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Below this many characters we assume extraction failed (scanned or
 * image-only PDF) and ask the user to paste their resume text instead.
 */
export const RESUME_MIN_CHARS = 300;

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type Kind = 'pdf' | 'docx' | 'txt';

function kindOf(file: File): Kind | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === DOCX_MIME || name.endsWith('.docx')) return 'docx';
  if (file.type === 'text/plain' || name.endsWith('.txt')) return 'txt';
  return null;
}

/** Returns an error message, or null when the file can be processed. */
export function validateResumeFile(file: File): string | null {
  if (!kindOf(file)) return 'Please upload a PDF, DOCX or TXT file.';
  if (file.size > RESUME_MAX_BYTES) return 'That file is over 5 MB.';
  return null;
}

async function extractPdf(file: File): Promise<string> {
  // Loaded on demand: pdf.js is large and only needed here.
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import(
    'pdfjs-dist/build/pdf.worker.min.mjs?url'
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({
    data: await file.arrayBuffer(),
    // Gives each drawn glyph its code, so different unmapped glyphs can be
    // told apart (see recoverUnmapped).
    fontExtraProperties: true,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      items.push({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
        fontName: item.fontName,
      });
    }
    await recoverUnmapped(page, items, pdfjs.OPS);
    // Reading order from positions, not content order (two-column resumes).
    pages.push(layoutPage(items, page.getViewport({ scale: 1 }).width));
  }
  return pages.join('\n\n');
}

/**
 * Fills in glyphs the PDF gives no character for (NUL in the text), using the
 * drawn glyphs' fonts, widths and context (see pdfGlyphs.ts). Only runs when
 * a page has such glyphs; anything unresolved stays NUL and shows as �.
 */
async function recoverUnmapped(
  page: PDFPageProxy,
  items: PdfTextItem[],
  OPS: { setFont: number; showText: number },
): Promise<void> {
  const missing = items.reduce((n, it) => n + it.str.split('\u0000').length - 1, 0);
  if (!missing) return;

  const ops = await page.getOperatorList();
  const glyphs: DrawnGlyph[] = [];
  let font = '';
  for (let i = 0; i < ops.fnArray.length; i++) {
    const args = ops.argsArray[i];
    if (ops.fnArray[i] === OPS.setFont) font = args[0];
    else if (ops.fnArray[i] === OPS.showText) {
      for (const g of args[0]) {
        if (g && typeof g === 'object' && 'unicode' in g) {
          glyphs.push({ font, code: g.originalCharCode, unicode: g.unicode, width: g.width });
        }
      }
    }
  }
  const fixes = resolveUnmapped(glyphs);
  // Text items and drawn glyphs come from the same content stream, so the
  // n-th NUL in the text is the n-th unmapped glyph. If the counts disagree,
  // don't guess.
  if (fixes.length !== missing) return;
  let n = 0;
  for (const it of items) {
    it.str = it.str.replaceAll('\u0000', () => fixes[n++] ?? '\u0000');
  }
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return value;
}

/** Plain text of a resume file, with whitespace tidied. */
export async function extractResumeText(file: File): Promise<string> {
  const kind = kindOf(file);
  const raw =
    kind === 'pdf'
      ? await extractPdf(file)
      : kind === 'docx'
        ? await extractDocx(file)
        : await file.text();
  return raw
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ResumeRow {
  id: string;
  file_name: string | null;
  storage_path: string | null;
  extracted_text: string;
  parsed: Record<string, unknown> | null;
  created_at: string;
}

function fromRow(r: ResumeRow): Resume {
  return {
    id: r.id,
    fileName: r.file_name,
    storagePath: r.storage_path,
    extractedText: r.extracted_text,
    parsed: r.parsed,
    createdAt: r.created_at,
  };
}

/**
 * Stores a new resume version (the original file, if any, goes to the private
 * `resumes` bucket) and makes it the user's active resume. Older versions are
 * kept.
 */
export async function saveResume(
  userId: string,
  text: string,
  file?: File,
): Promise<Resume> {
  let storagePath: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^\w.-]+/g, '_');
    storagePath = `${userId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from('resumes')
      .upload(storagePath, file, { contentType: file.type || undefined });
    if (error) throw error;
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      storage_path: storagePath,
      file_name: file?.name ?? null,
      extracted_text: text,
    })
    .select('id, file_name, storage_path, extracted_text, parsed, created_at')
    .single();
  if (error) throw error;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ active_resume_id: data.id })
    .eq('id', userId);
  if (profileError) throw profileError;

  return fromRow(data as ResumeRow);
}

export async function getResume(id: string): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('id, file_name, storage_path, extracted_text, parsed, created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return fromRow(data as ResumeRow);
}

/** Short-lived link to download the original uploaded file. */
export async function resumeDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

/** Job descriptions use the same readers (PDF, DOCX, TXT). */
export const extractDocumentText = extractResumeText;
export const validateDocumentFile = validateResumeFile;
