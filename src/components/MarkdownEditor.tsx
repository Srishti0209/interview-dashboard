import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/Markdown';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder = 'Write in markdown…',
  minRows = 8,
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <div className={cn('rounded-lg border', className)}>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          onClick={() => setMode('write')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors',
            mode === 'write'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Pencil className="size-3.5" /> Write
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors',
            mode === 'preview'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Eye className="size-3.5" /> Preview
        </button>
      </div>
      {mode === 'write' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={minRows}
          className="resize-y rounded-none border-0 font-mono text-[13px] shadow-none focus-visible:ring-0"
        />
      ) : (
        <div className="min-h-32 p-4">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
}
