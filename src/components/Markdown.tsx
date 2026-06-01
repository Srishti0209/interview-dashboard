import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders markdown (GFM) with Tailwind typography styling.
 * Code highlighting is handled by Shiki in a later pass; for now code
 * blocks get clean monospace styling.
 */
export const Markdown = memo(function Markdown({
  children,
  className,
}: MarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm prose-zinc max-w-none dark:prose-invert',
        'prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:rounded-lg',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-medium',
        'prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0',
        'prose-code:font-mono prose-pre:font-mono',
        'prose-headings:font-semibold prose-a:text-primary',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
});
