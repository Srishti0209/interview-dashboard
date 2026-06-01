import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { Editor, Range } from '@tiptap/core';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  ListChecks,
  Code2,
  Quote,
  Minus,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Table as TableIcon,
  Image as ImageIcon,
  Sigma,
  FunctionSquare,
  Workflow,
  Link2,
} from 'lucide-react';
import { SlashCommandList, type SlashListHandle } from './SlashCommandList';

export interface SlashItem {
  title: string;
  desc?: string;
  icon: typeof Type;
  keywords?: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

export interface SlashOptions {
  onImage: (editor: Editor, range: Range) => void;
  onQuestion: (editor: Editor, range: Range) => void;
}

function buildItems(opts: SlashOptions): SlashItem[] {
  return [
    {
      title: 'Text',
      desc: 'Plain paragraph',
      icon: Type,
      keywords: ['paragraph', 'p'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: 'Heading 1',
      icon: Heading1,
      keywords: ['h1', 'title'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      icon: Heading2,
      keywords: ['h2'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      icon: Heading3,
      keywords: ['h3'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
      title: 'Bullet list',
      icon: List,
      keywords: ['unordered', 'ul'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: 'Numbered list',
      icon: ListOrdered,
      keywords: ['ordered', 'ol'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: 'To-do list',
      icon: ListChecks,
      keywords: ['task', 'checkbox', 'todo'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: 'Code block',
      desc: 'Syntax-highlighted',
      icon: Code2,
      keywords: ['code', 'snippet'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: 'Quote',
      icon: Quote,
      keywords: ['blockquote'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: 'Divider',
      icon: Minus,
      keywords: ['hr', 'rule', 'separator'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: 'Callout — Info',
      icon: Info,
      keywords: ['callout', 'note', 'info'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout('info').run(),
    },
    {
      title: 'Callout — Warning',
      icon: AlertTriangle,
      keywords: ['callout', 'warning'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout('warning').run(),
    },
    {
      title: 'Callout — Success',
      icon: CheckCircle2,
      keywords: ['callout', 'success'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout('success').run(),
    },
    {
      title: 'Callout — Danger',
      icon: XCircle,
      keywords: ['callout', 'danger', 'error'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setCallout('danger').run(),
    },
    {
      title: 'Table',
      icon: TableIcon,
      keywords: ['grid'],
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: 'Image',
      desc: 'Upload (stored in your vault)',
      icon: ImageIcon,
      keywords: ['picture', 'photo'],
      command: ({ editor, range }) => opts.onImage(editor, range),
    },
    {
      title: 'Inline math',
      icon: Sigma,
      keywords: ['katex', 'latex', 'formula'],
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertInlineMath({ latex: 'a^2 + b^2 = c^2', pos: range.from })
          .run(),
    },
    {
      title: 'Math block',
      icon: FunctionSquare,
      keywords: ['katex', 'latex', 'equation'],
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertBlockMath({
            latex: '\\int_0^1 x^2 \\, dx = \\frac{1}{3}',
            pos: range.from,
          })
          .run(),
    },
    {
      title: 'Mermaid diagram',
      icon: Workflow,
      keywords: ['diagram', 'flowchart', 'graph'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertMermaid().run(),
    },
    {
      title: 'Question reference',
      desc: 'Link a question (bidirectional)',
      icon: Link2,
      keywords: ['question', 'link', 'reference'],
      command: ({ editor, range }) => opts.onQuestion(editor, range),
    },
  ];
}

export const SlashCommand = Extension.create<SlashOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onImage: () => {},
      onQuestion: () => {},
    };
  },

  addProseMirrorPlugins() {
    const allItems = buildItems(this.options);

    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          const q = query.toLowerCase();
          return allItems.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.keywords?.some((k) => k.includes(q)),
          );
        },
        render: () => {
          let component: ReactRenderer<SlashListHandle> | null = null;
          let popup: HTMLDivElement | null = null;

          const position = (rect: DOMRect | null) => {
            if (!popup || !rect) return;
            popup.style.left = `${rect.left}px`;
            popup.style.top = `${rect.bottom + 6}px`;
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  command: (item: SlashItem) => props.command(item),
                },
                editor: props.editor,
              });
              popup = document.createElement('div');
              popup.style.position = 'fixed';
              popup.style.zIndex = '60';
              popup.appendChild(component.element);
              document.body.appendChild(popup);
              position(props.clientRect?.() ?? null);
            },
            onUpdate: (props) => {
              component?.updateProps({
                items: props.items,
                command: (item: SlashItem) => props.command(item),
              });
              position(props.clientRect?.() ?? null);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.remove();
                component?.destroy();
                return true;
              }
              return component?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              popup?.remove();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
