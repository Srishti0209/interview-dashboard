import { cn } from '@/lib/utils';
import {
  ROUND_LABEL,
  ROUND_COLOR,
  DIFFICULTY_COLOR,
} from '@/lib/constants';
import type { RoundType, Difficulty } from '@/types';

export function RoundPill({
  round,
  className,
}: {
  round: RoundType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        ROUND_COLOR[round],
        className,
      )}
    >
      {ROUND_LABEL[round]}
    </span>
  );
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize',
        DIFFICULTY_COLOR[difficulty],
        className,
      )}
    >
      {difficulty}
    </span>
  );
}

export function ConfidenceDots({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      title={`Confidence ${confidence}/5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            'size-1.5 rounded-full',
            n <= confidence
              ? 'bg-emerald-500'
              : 'bg-zinc-300 dark:bg-zinc-600',
          )}
        />
      ))}
    </span>
  );
}
