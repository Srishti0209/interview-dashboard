import { db } from '@/lib/db';
import { uid } from '@/lib/utils';
import type { Note } from '@/types';

const EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export async function createNote(title = 'Untitled note'): Promise<string> {
  const now = Date.now();
  const note: Note = {
    id: uid(),
    title,
    bodyJson: EMPTY_DOC,
    tags: [],
    linkedQuestionIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.put(note);
  return note.id;
}

export async function updateNote(
  id: string,
  patch: Partial<Note>,
): Promise<void> {
  await db.notes.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

/** Walk a Tiptap doc and collect questionIds from questionReference nodes. */
export function extractLinkedQuestionIds(doc: unknown): string[] {
  const ids = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; attrs?: { questionId?: string }; content?: unknown[] };
    if (n.type === 'questionReference' && n.attrs?.questionId) {
      ids.add(n.attrs.questionId);
    }
    n.content?.forEach(walk);
  };
  walk(doc);
  return [...ids];
}

/** Persist a note's body and keep linkedQuestionIds in sync (bidirectional). */
export async function saveNoteBody(
  id: string,
  bodyJson: object,
  title?: string,
): Promise<void> {
  const linkedQuestionIds = extractLinkedQuestionIds(bodyJson);
  const patch: Partial<Note> = { bodyJson, linkedQuestionIds };
  if (title !== undefined) patch.title = title;
  await updateNote(id, patch);
}

// ---------- Markdown export ----------

type TNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function inline(nodes: TNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') {
        let t = n.text ?? '';
        for (const m of n.marks ?? []) {
          if (m.type === 'bold') t = `**${t}**`;
          else if (m.type === 'italic') t = `*${t}*`;
          else if (m.type === 'code') t = `\`${t}\``;
          else if (m.type === 'strike') t = `~~${t}~~`;
          else if (m.type === 'link')
            t = `[${t}](${(m.attrs?.href as string) ?? ''})`;
        }
        return t;
      }
      if (n.type === 'inlineMath') return `$${n.attrs?.latex ?? ''}$`;
      if (n.type === 'hardBreak') return '  \n';
      return '';
    })
    .join('');
}

function block(node: TNode, depth = 0): string {
  switch (node.type) {
    case 'paragraph':
      return inline(node.content) + '\n';
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      return `${'#'.repeat(level)} ${inline(node.content)}\n`;
    }
    case 'bulletList':
      return (
        (node.content ?? [])
          .map((li) => `${'  '.repeat(depth)}- ${childText(li, depth)}`)
          .join('\n') + '\n'
      );
    case 'orderedList':
      return (
        (node.content ?? [])
          .map(
            (li, i) => `${'  '.repeat(depth)}${i + 1}. ${childText(li, depth)}`,
          )
          .join('\n') + '\n'
      );
    case 'taskList':
      return (
        (node.content ?? [])
          .map(
            (li) =>
              `${'  '.repeat(depth)}- [${li.attrs?.checked ? 'x' : ' '}] ${childText(
                li,
                depth,
              )}`,
          )
          .join('\n') + '\n'
      );
    case 'blockquote':
      return (
        (node.content ?? [])
          .map((c) => `> ${block(c, depth).trim()}`)
          .join('\n') + '\n'
      );
    case 'codeBlock':
      return `\`\`\`${node.attrs?.language ?? ''}\n${(node.content ?? [])
        .map((c) => c.text ?? '')
        .join('')}\n\`\`\`\n`;
    case 'horizontalRule':
      return `---\n`;
    case 'blockMath':
      return `$$\n${node.attrs?.latex ?? ''}\n$$\n`;
    case 'mermaid':
      return `\`\`\`mermaid\n${node.attrs?.code ?? ''}\n\`\`\`\n`;
    case 'callout':
      return (
        `> [!${String(node.attrs?.variant ?? 'info').toUpperCase()}]\n` +
        (node.content ?? [])
          .map((c) => `> ${block(c, depth).trim()}`)
          .join('\n') +
        '\n'
      );
    case 'questionReference':
      return `> 📌 Linked question: \`${node.attrs?.questionId ?? ''}\`\n`;
    case 'image':
      return `![${node.attrs?.alt ?? ''}](${node.attrs?.src ?? ''})\n`;
    case 'table':
      return tableToMd(node) + '\n';
    default:
      return node.content ? node.content.map((c) => block(c, depth)).join('') : '';
  }
}

function childText(li: TNode, depth: number): string {
  return (li.content ?? [])
    .map((c) =>
      c.type === 'bulletList' ||
      c.type === 'orderedList' ||
      c.type === 'taskList'
        ? '\n' + block(c, depth + 1).trimEnd()
        : inline(c.content),
    )
    .join('')
    .trim();
}

function tableToMd(node: TNode): string {
  const rows = node.content ?? [];
  const lines: string[] = [];
  rows.forEach((row, ri) => {
    const cells = (row.content ?? []).map((cell) =>
      (cell.content ?? []).map((c) => inline(c.content)).join(' ').trim(),
    );
    lines.push(`| ${cells.join(' | ')} |`);
    if (ri === 0) lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
  });
  return lines.join('\n');
}

export function noteToMarkdown(note: Note): string {
  const doc = note.bodyJson as TNode;
  const body = (doc.content ?? []).map((n) => block(n)).join('\n');
  return `# ${note.title || 'Untitled note'}\n\n${body}`.trim() + '\n';
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(s: string): string {
  return (s || 'untitled').replace(/[^a-z0-9-_ ]/gi, '').slice(0, 60).trim();
}

export async function exportVaultZip(): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const notes = await db.notes.toArray();
  const seen = new Map<string, number>();
  for (const n of notes) {
    let base = safeName(n.title);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (count) base = `${base}-${count}`;
    zip.file(`${base}.md`, noteToMarkdown(n));
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'interview-prep-notes.zip';
  a.click();
  URL.revokeObjectURL(url);
}
