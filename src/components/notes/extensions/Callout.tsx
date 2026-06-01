import { Node, mergeAttributes } from '@tiptap/core';
import {
  ReactNodeViewRenderer,
  NodeViewContent,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from '@tiptap/react';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'danger';

const VARIANTS: Record<
  CalloutVariant,
  { icon: typeof Info; cls: string }
> = {
  info: {
    icon: Info,
    cls: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100',
  },
  warning: {
    icon: AlertTriangle,
    cls: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
  },
  success: {
    icon: CheckCircle2,
    cls: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
  },
  danger: {
    icon: XCircle,
    cls: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
  },
};

function CalloutView({ node }: ReactNodeViewProps) {
  const variant = (node.attrs.variant ?? 'info') as CalloutVariant;
  const { icon: Icon, cls } = VARIANTS[variant] ?? VARIANTS.info;
  return (
    <NodeViewWrapper
      className={cn('my-2 flex gap-3 rounded-lg border px-4 py-3', cls)}
      data-variant={variant}
    >
      <span contentEditable={false} className="mt-0.5 shrink-0">
        <Icon className="size-4" />
      </span>
      <NodeViewContent className="prose-callout min-w-0 flex-1" />
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant: CalloutVariant) => ReturnType;
      toggleCallout: (variant: CalloutVariant) => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-variant') || 'info',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (variant) =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      toggleCallout:
        (variant) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
