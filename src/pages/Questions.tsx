import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  List,
  LayoutGrid,
  GalleryVerticalEnd,
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
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

const PAGE_SIZE = 10;

/** Page numbers to show, with null for a gap: 1 … 4 5 6 … 25 */
function pageList(page: number, total: number): (number | null)[] {
  const pages = [...new Set([1, page - 1, page, page + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]));
}

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
  // ?ids=a,b,c (e.g. "Practise these" on a job) shows just those questions.
  const [params, setParams] = useSearchParams();
  const idsParam = params.get('ids');
  const pinnedLabel = params.get('label');

  const filtered = useMemo(() => {
    if (!questions) return [];
    const ids = idsParam ? new Set(idsParam.split(',')) : null;
    const pool = ids ? questions.filter((q) => ids.has(q.id)) : questions;
    return filterQuestions(pool, filters, reviewStates).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [questions, filters, reviewStates, idsParam]);

  // ?page=N, so Back from a question returns to the same page.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(params.get('page')) || 1));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (n: number) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (n > 1) next.set('page', String(n));
        else next.delete('page');
        return next;
      },
      { replace: false },
    );
    setCursor(0);
    window.scrollTo({ top: 0 });
  };

  // New filters start again at page 1 (but not on first render, so the
  // page survives coming back from a question).
  const lastFilters = useRef(filters);
  useEffect(() => {
    if (lastFilters.current === filters) return;
    lastFilters.current = filters;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [filters, setParams]);

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
              ? Math.min(pageItems.length - 1, c + 1)
              : Math.max(0, c - 1);
          document
            .getElementById(`q-row-${next}`)
            ?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter' && pageItems[cursor]) {
        navigate(`/questions/${pageItems[cursor].id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, pageItems, cursor, navigate]);

  useEffect(() => setCursor(0), [filters, view]);

  const loading = questions === undefined;

  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r p-4 lg:sticky lg:top-12 lg:block lg:h-[calc(100svh-3rem)]">
        <FilterSidebar tags={tags} companies={companies} />
      </aside>

      {/* Full height, so the pager sits at the bottom even on short pages. */}
      <div className="flex min-h-[calc(100svh-3rem)] min-w-0 flex-1 flex-col p-4 pb-0 md:p-6 md:pb-0">
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

        {idsParam && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-accent/40 px-3 py-2 text-sm"
            data-testid="pinned-questions"
          >
            <span>
              Showing {filtered.length} question{filtered.length === 1 ? '' : 's'}
              {pinnedLabel ? ` for ${pinnedLabel}` : ''}
            </span>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setParams({})}>
              Show all questions
            </Button>
          </div>
        )}

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
          <div className="mb-6 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No questions match your filters.
          </div>
        ) : view === 'deck' ? (
          <div className="pb-6">
            <StudyDeck questions={filtered} />
          </div>
        ) : view === 'cards' ? (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((q, i) => (
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
          <div className="mb-4 space-y-2">
            {pageItems.map((q, i) => (
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

        {!loading && view !== 'deck' && filtered.length > 0 && (
          <nav
            className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] -mx-4 mt-auto md:bottom-0 flex flex-wrap items-center justify-between gap-2 border-t bg-background px-4 py-3 md:-mx-6 md:px-6"
            aria-label="Pagination"
            data-testid="pagination"
          >
            <p className="text-sm text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + pageItems.length} of{' '}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" /> Prev
              </Button>
              {pageList(page, totalPages).map((n, i) =>
                n === null ? (
                  <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={n}
                    variant={n === page ? 'default' : 'ghost'}
                    size="sm"
                    className="min-w-8 px-2"
                    onClick={() => goToPage(n)}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => goToPage(page + 1)}
                aria-label="Next page"
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </nav>
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
