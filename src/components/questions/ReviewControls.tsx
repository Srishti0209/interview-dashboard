import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReviewState } from '@/hooks/useQuestions';
import { useUIStore } from '@/store/ui';
import {
  computeNextReview,
  reviewQuestion,
  DAY_MS,
  type Rating,
  type SrsConfig,
} from '@/lib/sm2';

const BUTTONS: { rating: Rating; label: string; key: string; cls: string }[] = [
  {
    rating: 'again',
    label: 'Again',
    key: '1',
    cls: 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10',
  },
  {
    rating: 'hard',
    label: 'Hard',
    key: '2',
    cls: 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10',
  },
  {
    rating: 'good',
    label: 'Good',
    key: '3',
    cls: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
  },
  {
    rating: 'easy',
    label: 'Easy',
    key: '4',
    cls: 'border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10',
  },
];

function intervalLabel(days: number): string {
  if (days < 1) return '<1d';
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function ReviewControls({
  questionId,
  onReviewed,
}: {
  questionId: string;
  onReviewed?: () => void;
}) {
  const review = useReviewState(questionId);
  const hardFactor = useUIStore((s) => s.srsHardFactor);
  const easyBonus = useUIStore((s) => s.srsEasyBonus);
  const config: SrsConfig = { hardFactor, easyBonus };

  const handle = async (rating: Rating) => {
    await reviewQuestion(questionId, rating, config);
    onReviewed?.();
  };

  // Keyboard 1-4 (ignore when typing in inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      )
        return;
      const btn = BUTTONS.find((b) => b.key === e.key);
      if (btn) {
        e.preventDefault();
        void handle(btn.rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, review]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Spaced repetition
        </h2>
        <span className="text-xs text-muted-foreground">
          {review?.lastReviewed
            ? `Last reviewed ${formatDistanceToNow(review.lastReviewed, {
                addSuffix: true,
              })}`
            : 'Not reviewed yet'}
          {review?.nextDue
            ? ` • Next ${formatDistanceToNow(review.nextDue, {
                addSuffix: true,
              })}`
            : ''}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.map((b) => {
          const projected = computeNextReview(review, b.rating, Date.now(), config);
          return (
            <button
              key={b.rating}
              onClick={() => handle(b.rating)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border bg-background py-2 text-sm font-medium transition-colors',
                b.cls,
              )}
            >
              <span>{b.label}</span>
              <span className="text-[10px] font-normal opacity-70">
                {intervalLabel(projected.nextDue - Date.now() > 0
                  ? (projected.nextDue - Date.now()) / DAY_MS
                  : projected.intervalDays)}{' '}
                · {b.key}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
