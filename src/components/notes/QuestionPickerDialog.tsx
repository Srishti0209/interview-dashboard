import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import { useAllQuestions } from '@/hooks/useQuestions';

export function QuestionPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (questionId: string) => void;
}) {
  const questions = useAllQuestions();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = questions ?? [];
    if (!query) return list.slice(0, 50);
    return list
      .filter((item) => item.title.toLowerCase().includes(query))
      .slice(0, 50);
  }, [questions, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80svh] overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Link a question</DialogTitle>
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions…"
            className="mt-2"
          />
        </DialogHeader>
        <div className="max-h-[55svh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No questions found.
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="flex w-full flex-col gap-1.5 rounded-md px-3 py-2 text-left hover:bg-accent"
              >
                <span className="text-sm font-medium">{item.title}</span>
                <span className="flex items-center gap-1.5">
                  <RoundPill round={item.roundType} />
                  <DifficultyBadge difficulty={item.difficulty} />
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
