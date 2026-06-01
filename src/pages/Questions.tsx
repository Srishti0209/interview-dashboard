import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  List,
  LayoutGrid,
  GalleryVerticalEnd,
  Plus,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FilterSidebar } from '@/components/questions/FilterSidebar';
import { QuestionItem } from '@/components/questions/QuestionItem';
import { StudyDeck } from '@/components/questions/StudyDeck';
import {
  useAllQuestions,
  useReviewStates,
  useFacets,
  filterQuestions,
} from '@/hooks/useQuestions';
import { useUIStore, type QuestionView } from '@/store/ui';
import { cn } from '@/lib/utils';

const VIEW_OPTIONS: { value: QuestionView; icon: typeof List; label: string }[] =
  [
    { value: 'list', icon: List, label: 'List' },
    { value: 'cards', icon: LayoutGrid, label: 'Cards' },
    { value: 'deck', icon: GalleryVerticalEnd, label: 'Deck' },
  ];

export default function Questions() {
  const questions = useAllQuestions();
  const reviewStates = useReviewStates();
  const { tags, companies } = useFacets(questions);

  const filters = useUIStore((s) => s.filters);
  const setFilters = useUIStore((s) => s.setFilters);
  const view = useUIStore((s) => s.questionView);
  const setView = useUIStore((s) => s.setQuestionView);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!questions) return [];
    return filterQuestions(questions, filters, reviewStates).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [questions, filters, reviewStates]);

  // J / K to move, Enter to open (list & card views).
  useEffect(() => {
    if (view === 'deck') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        setCursor((c) => {
          const next =
            e.key === 'j'
              ? Math.min(filtered.length - 1, c + 1)
              : Math.max(0, c - 1);
          document
            .getElementById(`q-row-${next}`)
            ?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter' && filtered[cursor]) {
        navigate(`/questions/${filtered[cursor].id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, filtered, cursor, navigate]);

  useEffect(() => setCursor(0), [filters, view]);

  const loading = questions === undefined;

  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r p-4 lg:sticky lg:top-0 lg:block lg:h-svh">
        <FilterSidebar tags={tags} companies={companies} />
      </aside>

      <div className="min-w-0 flex-1 p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Question Bank
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading ? '…' : `${filtered.length} of ${questions?.length}`}{' '}
              questions
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/my-questions/new">
              <Plus className="size-4" /> Add question
            </Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search title, body, your answers, notes…"
              className="pl-9"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal className="size-4" /> Filters
          </Button>

          <div className="flex items-center rounded-md border p-0.5">
            {VIEW_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setView(value)}
                title={label}
                className={cn(
                  'rounded p-1.5 transition-colors',
                  view === value
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border bg-muted/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No questions match your filters.
          </div>
        ) : view === 'deck' ? (
          <StudyDeck questions={filtered} />
        ) : view === 'cards' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((q, i) => (
              <div key={q.id} id={`q-row-${i}`}>
                <QuestionItem
                  question={q}
                  review={reviewStates.get(q.id)}
                  variant="card"
                  selected={i === cursor}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((q, i) => (
              <div key={q.id} id={`q-row-${i}`}>
                <QuestionItem
                  question={q}
                  review={reviewStates.get(q.id)}
                  variant="list"
                  selected={i === cursor}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile filters dialog */}
      <Dialog open={mobileFilters} onOpenChange={setMobileFilters}>
        <DialogContent className="max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <FilterSidebar tags={tags} companies={companies} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
