import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import type { SlashItem } from './SlashCommand';
import { cn } from '@/lib/utils';

export interface SlashListHandle {
  onKeyDown: (e: KeyboardEvent) => boolean;
}

export const SlashCommandList = forwardRef<
  SlashListHandle,
  { items: SlashItem[]; command: (item: SlashItem) => void }
>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % Math.max(1, items.length));
        return true;
      }
      if (e.key === 'ArrowUp') {
        setSelected((s) => (s - 1 + items.length) % Math.max(1, items.length));
        return true;
      }
      if (e.key === 'Enter') {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-64 rounded-lg border bg-popover p-2 text-sm text-muted-foreground shadow-md">
        No matches
      </div>
    );
  }

  return (
    <div className="max-h-72 w-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              command(item);
            }}
            onMouseEnter={() => setSelected(i)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm',
              i === selected
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground',
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded border bg-background">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.title}</span>
              {item.desc && (
                <span className="block truncate text-xs text-muted-foreground">
                  {item.desc}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
});
SlashCommandList.displayName = 'SlashCommandList';
