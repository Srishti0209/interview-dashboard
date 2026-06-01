import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { Range } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { InlineMath, BlockMath } from '@tiptap/extension-mathematics';
import { createLowlight, common } from 'lowlight';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from 'lucide-react';

import { Callout } from './extensions/Callout';
import { QuestionReference } from './extensions/QuestionReference';
import { MermaidBlock } from './extensions/MermaidBlock';
import { SlashCommand } from './extensions/SlashCommand';
import { QuestionPickerDialog } from './QuestionPickerDialog';
import { SaveStatus } from '@/components/SaveStatus';
import { saveNoteBody, updateNote } from '@/lib/notes';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

const lowlight = createLowlight(common);

export function NoteEditor({ note }: { note: Note }) {
  const fontSize = useUIStore((s) => s.notepadFontSize);
  const [title, setTitle] = useState(note.title);
  const titleRef = useRef(note.title);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pendingRange = useRef<{ editor: Editor; range: Range } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageTarget = useRef<{ editor: Editor; range: Range } | null>(null);
  const bodyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false }),
      InlineMath,
      BlockMath,
      Callout,
      QuestionReference,
      MermaidBlock,
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing…",
      }),
      SlashCommand.configure({
        onImage: (editor, range) => {
          imageTarget.current = { editor, range };
          fileInput.current?.click();
        },
        onQuestion: (editor, range) => {
          pendingRange.current = { editor, range };
          setPickerOpen(true);
        },
      }),
    ],
    content: note.bodyJson,
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-sm prose-zinc max-w-none dark:prose-invert focus:outline-none min-h-[60vh] px-1 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      setStatus('idle');
      if (bodyTimer.current) clearTimeout(bodyTimer.current);
      bodyTimer.current = setTimeout(async () => {
        setStatus('saving');
        await saveNoteBody(note.id, editor.getJSON());
        setStatus('saved');
      }, 2000);
    },
  });

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (bodyTimer.current) clearTimeout(bodyTimer.current);
      if (titleTimer.current) clearTimeout(titleTimer.current);
      if (editor) void saveNoteBody(note.id, editor.getJSON(), titleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Title autosave (independent of body timer)
  const onTitleChange = useCallback(
    (v: string) => {
      setTitle(v);
      titleRef.current = v;
      if (titleTimer.current) clearTimeout(titleTimer.current);
      titleTimer.current = setTimeout(() => {
        void updateNote(note.id, { title: v });
      }, 600);
    },
    [note.id],
  );

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const target = imageTarget.current;
      const src = reader.result as string;
      if (target) {
        target.editor
          .chain()
          .focus()
          .deleteRange(target.range)
          .setImage({ src })
          .run();
      } else if (editor) {
        editor.chain().focus().setImage({ src }).run();
      }
      imageTarget.current = null;
    };
    reader.readAsDataURL(file);
  };

  const toolbar = useMemo(
    () => [
      { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: 'bold' },
      { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: 'italic' },
      { icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), active: 'strike' },
      { icon: Code, action: () => editor?.chain().focus().toggleCode().run(), active: 'code' },
      { icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: 'heading', attrs: { level: 1 } },
      { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: 'heading', attrs: { level: 2 } },
      { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), active: 'bulletList' },
      { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), active: 'orderedList' },
    ],
    [editor],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolbar.map((t, i) => {
            const Icon = t.icon;
            const isActive = editor?.isActive(t.active, t.attrs);
            return (
              <button
                key={i}
                onClick={t.action}
                className={cn(
                  'rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  isActive && 'bg-accent text-foreground',
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <SaveStatus status={status} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled note"
            className="mt-6 w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
          />
          <div style={{ fontSize: `${fontSize}px` }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImage(f);
          e.target.value = '';
        }}
      />

      <QuestionPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(qid) => {
          const target = pendingRange.current;
          if (target) {
            target.editor
              .chain()
              .focus()
              .deleteRange(target.range)
              .insertQuestionReference(qid)
              .run();
          } else {
            editor?.chain().focus().insertQuestionReference(qid).run();
          }
          pendingRange.current = null;
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
