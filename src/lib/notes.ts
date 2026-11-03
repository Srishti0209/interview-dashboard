import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { enqueue, waitForPendingWrites } from '@/lib/sync';
import { uid } from '@/lib/utils';
import type { Note } from '@/types';

export const NOTES_KEY = ['notes'] as const;

interface NoteRow {
  id: string;
  title: string;
  body_json: object;
  tags: string[];
  linked_question_ids: string[];
  created_at: number;
  updated_at: number;
}

const NOTE_COLUMNS =
  'id, title, body_json, tags, linked_question_ids, created_at, updated_at';

/** All of the user's notes, most recently edited first. */
export async function fetchNotes(): Promise<Note[]> {
  await waitForPendingWrites();
  const rows = await fetchAll<NoteRow>('notes', NOTE_COLUMNS, 'id');
  return sortNotes(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      bodyJson: r.body_json,
      tags: r.tags,
      linkedQuestionIds: r.linked_question_ids,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    })),
  );
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

function setNotes(fn: (notes: Note[]) => Note[]) {
  queryClient.setQueryData<Note[]>(NOTES_KEY, (n) => (n ? sortNotes(fn(n)) : n));
}

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
  setNotes((n) => [note, ...n]);
  void enqueue({
    type: 'upsert',
    table: 'notes',
    rows: [
      {
        id: note.id,
        title: note.title,
        body_json: note.bodyJson,
        tags: note.tags,
        linked_question_ids: note.linkedQuestionIds,
        created_at: now,
        updated_at: now,
      },
    ],
    onConflict: 'id',
  });
  return note.id;
}

export async function updateNote(
  id: string,
  patch: Partial<Note>,
): Promise<void> {
  const now = Date.now();
  const base = queryClient
    .getQueryData<Note[]>(NOTES_KEY)
    ?.find((n) => n.id === id)?.updatedAt;
  setNotes((notes) =>
    notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now } : n)),
  );

  const row: Record<string, unknown> = { updated_at: now };
  if ('title' in patch) row.title = patch.title;
  if ('bodyJson' in patch) row.body_json = patch.bodyJson;
  if ('tags' in patch) row.tags = patch.tags;
  if ('linkedQuestionIds' in patch) row.linked_question_ids = patch.linkedQuestionIds;

  void enqueue({
    type: 'update',
    table: 'notes',
    match: { id },
    patch: row,
    // Keep the other device's version if this edit would overwrite it.
    guard:
      'bodyJson' in patch && base !== undefined
        ? {
            entity: 'note',
            entityId: id,
            match: { id },
            baseUpdatedAt: base,
            columns: ['title', 'body_json'],
          }
        : undefined,
  });
}

export async function deleteNote(id: string): Promise<void> {
  setNotes((notes) => notes.filter((n) => n.id !== id));
  void enqueue({ type: 'delete', table: 'notes', match: { id } });
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
  const notes = await queryClient.fetchQuery({
    queryKey: NOTES_KEY,
    queryFn: fetchNotes,
  });
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
