import { Link } from 'react-router-dom';
import { Bookmark, PencilLine, User } from 'lucide-react';
import {
  RoundPill,
  DifficultyBadge,
  ConfidenceDots,
} from '@/components/QuestionMeta';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Question, ReviewState } from '@/types';

interface Props {
  question: Question;
  review?: ReviewState;
  variant: 'list' | 'card';
  selected?: boolean;
}

export function QuestionItem({ question, review, variant, selected }: Props) {
  const hasPersonal = !!question.personalAnswer?.trim();
  const confidence = review?.confidence ?? 0;

  const meta = (
    <div className="flex flex-wrap items-center gap-1.5">
      <RoundPill round={question.roundType} />
      <DifficultyBadge difficulty={question.difficulty} />
      {question.company?.slice(0, 3).map((c) => (
        <Badge key={c} variant="outline" className="font-normal">
          {c}
        </Badge>
      ))}
    </div>
  );

  const indicators = (
    <div className="flex items-center gap-2 text-muted-foreground">
      <ConfidenceDots confidence={confidence} />
      {hasPersonal && (
        <span title="Has your answer">
          <User className="size-3.5 text-emerald-500" />
        </span>
      )}
      {question.source === 'user' && (
        <span title="Your question">
          <PencilLine className="size-3.5 text-sky-500" />
        </span>
      )}
      {question.bookmarked && (
        <Bookmark className="size-3.5 fill-amber-400 text-amber-500" />
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Link
        to={`/questions/${question.id}`}
        className={cn(
          'flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40',
          selected && 'ring-2 ring-ring',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">
            {question.title}
          </h3>
          {question.bookmarked && (
            <Bookmark className="size-4 shrink-0 fill-amber-400 text-amber-500" />
          )}
        </div>
        {meta}
        <div className="mt-auto flex items-center justify-between">
          {indicators}
          {question.tags?.length > 0 && (
            <span className="truncate text-xs text-muted-foreground">
              {question.tags.slice(0, 2).join(' · ')}
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/questions/${question.id}`}
      className={cn(
        'flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40',
        selected && 'ring-2 ring-ring',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium">{question.title}</h3>
        </div>
        <div className="mt-1.5">{meta}</div>
      </div>
      {indicators}
    </Link>
  );
}
