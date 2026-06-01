import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function TokenInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter…',
  className,
}: TokenInputProps) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (!value.some((v) => v.toLowerCase() === t.toLowerCase())) {
      onChange([...value, t]);
    }
    setInput('');
  };

  const remove = (t: string) => onChange(value.filter((v) => v !== t));

  const matching = suggestions
    .filter(
      (s) =>
        input &&
        s.toLowerCase().includes(input.toLowerCase()) &&
        !value.some((v) => v.toLowerCase() === s.toLowerCase()),
    )
    .slice(0, 6);

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-transparent p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(input);
            } else if (e.key === 'Backspace' && !input && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {matching.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {matching.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
