import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/Markdown';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import type { Question } from '@/types';

export function StudyDeck({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
  }, [questions]);

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        No questions match your filters.
      </div>
    );
  }

  const q = questions[Math.min(index, questions.length - 1)];
  const go = (delta: number) => {
    setRevealed(false);
    setIndex((i) => (i + delta + questions.length) % questions.length);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Card {index + 1} of {questions.length}
        </span>
        <Link
          to={`/questions/${q.id}`}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          Open detail <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="min-h-72 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <RoundPill round={q.roundType} />
          <DifficultyBadge difficulty={q.difficulty} />
        </div>
        <h2 className="text-lg font-semibold">{q.title}</h2>
        <div className="mt-3">
          <Markdown>{q.body}</Markdown>
        </div>

        {revealed && (q.answer || q.personalAnswer) && (
          <div className="mt-5 border-t pt-4">
            {q.personalAnswer?.trim() && (
              <div className="mb-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Your answer
                </p>
                <Markdown>{q.personalAnswer}</Markdown>
              </div>
            )}
            {q.answer?.trim() && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Model answer
                </p>
                <Markdown>{q.answer}</Markdown>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => go(-1)}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        {q.answer || q.personalAnswer ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? (
              <>
                <EyeOff className="size-4" /> Hide
              </>
            ) : (
              <>
                <Eye className="size-4" /> Reveal answer
              </>
            )}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">No answer yet</span>
        )}
        <Button variant="outline" size="sm" onClick={() => go(1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
