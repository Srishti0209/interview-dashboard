import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import { AdminNav } from '@/components/admin/AdminNav';
import { ADMIN_QUESTIONS_KEY, fetchSharedQuestions } from '@/lib/admin';
import { ROLE_FAMILIES, ROLE_FAMILY_LABEL, ROUND_LABEL, ROUND_TYPES } from '@/lib/constants';

const PAGE_SIZE = 20;
const ALL = 'all';

/** /admin: the shared question bank, drafts included. */
export default function AdminQuestions() {
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ADMIN_QUESTIONS_KEY,
    queryFn: fetchSharedQuestions,
  });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(ALL);
  const [round, setRound] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'bank' | 'bin'>('bank');
  const binned = (questions ?? []).filter((x) => x.deletedAt !== null).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (questions ?? []).filter(
      (x) =>
        (tab === 'bin') === (x.deletedAt !== null) &&
        (!q || x.title.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.tags.some((t) => t.toLowerCase().includes(q))) &&
        (role === ALL || x.roleFamilies.includes(role as never)) &&
        (round === ALL || x.roundType === round) &&
        (status === ALL || x.status === status),
    );
  }, [questions, search, role, round, status, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  // Any filter change starts again at page 1.
  const filterSetter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <AdminNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Admin: question bank</h1>
          <p className="text-sm text-muted-foreground">
            Shared questions everyone sees. Changes are live as soon as you save a published question.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/questions/new">
            <Plus className="size-4" /> New question
          </Link>
        </Button>
      </div>

      <div className="mb-3 flex gap-1 border-b" role="tablist">
        {([['bank', 'Questions'], ['bin', `Bin (${binned})`]] as const).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => filterSetter((v) => setTab(v as 'bank' | 'bin'))(value)}
            className={
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ' +
              (tab === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')
            }
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'bin' && (
        <p className="mb-3 text-sm text-muted-foreground">
          Hidden from users, with their answers kept. Open a question to restore it or delete it forever.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => filterSetter(setSearch)(e.target.value)}
            placeholder="Search title, id or tag…"
            className="pl-9"
            aria-label="Search questions"
          />
        </div>
        <FilterSelect label="Role" value={role} onChange={filterSetter(setRole)}
          options={ROLE_FAMILIES.map((r) => [r, ROLE_FAMILY_LABEL[r]])} />
        <FilterSelect label="Round" value={round} onChange={filterSetter(setRound)}
          options={ROUND_TYPES.map((r) => [r, ROUND_LABEL[r]])} />
        <FilterSelect label="Status" value={status} onChange={filterSetter(setStatus)}
          options={[['approved', 'Published'], ['draft', 'Draft']]} />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground" data-testid="admin-count">
            {filtered.length} of {questions?.length ?? 0} questions
          </p>
          <div className="space-y-2">
            {pageItems.map((q) => (
              <Card key={q.id} className="p-0">
                <Link
                  to={`/admin/questions/${q.id}`}
                  className="block space-y-1.5 rounded-xl p-3 transition-colors hover:bg-accent/50"
                  data-testid="admin-row"
                >
                  <p className="text-sm font-medium">{q.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RoundPill round={q.roundType} />
                    <DifficultyBadge difficulty={q.difficulty} />
                    {q.status === 'draft' && <Badge variant="outline" className="font-normal">Draft</Badge>}
                    {q.adminEdited && <Badge variant="secondary" className="font-normal">Edited in admin</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {q.roleFamilies.map((r) => ROLE_FAMILY_LABEL[r] ?? r).join(', ')}
                    </span>
                  </div>
                </Link>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                {tab === 'bin' ? 'The bin is empty.' : 'No questions match.'}
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {current} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={current === totalPages} onClick={() => setPage(current + 1)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
