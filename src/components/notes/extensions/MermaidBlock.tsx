import { useEffect, useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from '@tiptap/react';
import { Code2, Eye } from 'lucide-react';
import { uid } from '@/lib/utils';

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;
async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'default',
        securityLevel: 'loose',
      });
      return m.default;
    });
  }
  return mermaidPromise;
}

function MermaidView({ node, updateAttributes }: ReactNodeViewProps) {
  const code = (node.attrs.code ?? '') as string;
  const [mode, setMode] = useState<'preview' | 'edit'>(
    code ? 'preview' : 'edit',
  );
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const idRef = useRef('mmd-' + uid().slice(0, 8));

  useEffect(() => {
    let active = true;
    if (mode !== 'preview' || !code.trim()) return;
    (async () => {
      try {
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(idRef.current, code);
        if (active) {
          setSvg(svg);
          setError('');
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [code, mode]);

  return (
    <NodeViewWrapper
      className="my-2"
      data-type="mermaid"
      contentEditable={false}
    >
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground">
            Mermaid diagram
          </span>
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {mode === 'edit' ? (
              <>
                <Eye className="size-3" /> Preview
              </>
            ) : (
              <>
                <Code2 className="size-3" /> Edit
              </>
            )}
          </button>
        </div>
        {mode === 'edit' ? (
          <textarea
            value={code}
            onChange={(e) => updateAttributes({ code: e.target.value })}
            placeholder={'graph TD\n  A[Start] --> B[End]'}
            className="min-h-28 w-full resize-y bg-transparent p-3 font-mono text-[13px] outline-none"
            spellCheck={false}
          />
        ) : error ? (
          <pre className="m-0 whitespace-pre-wrap p-3 text-xs text-destructive">
            {error}
          </pre>
        ) : (
          <div
            className="flex justify-center overflow-x-auto p-3"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaid: {
      insertMermaid: () => ReturnType;
    };
  }
}

export const MermaidBlock = Node.create({
  name: 'mermaid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      code: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-code') || '',
        renderHTML: (attrs) => ({ 'data-code': attrs.code }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid' })];
  },

  addCommands() {
    return {
      insertMermaid:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { code: 'graph TD\n  A[Start] --> B[End]' },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidView);
  },
});
