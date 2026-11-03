import { supabase } from '@/lib/supabase';
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

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    const lines: string[] = [];
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      }
    }
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
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
  created_at: string;
}

function fromRow(r: ResumeRow): Resume {
  return {
    id: r.id,
    fileName: r.file_name,
    storagePath: r.storage_path,
    extractedText: r.extracted_text,
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
    .select('id, file_name, storage_path, extracted_text, created_at')
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
    .select('id, file_name, storage_path, extracted_text, created_at')
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
