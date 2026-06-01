import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md';
  readOnly?: boolean;
}) {
  const px = size === 'sm' ? 'size-4' : 'size-6';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(!readOnly && 'cursor-pointer', 'disabled:cursor-default')}
        >
          <Star
            className={cn(
              px,
              n <= value
                ? 'fill-amber-400 text-amber-500'
                : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}
