import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ListChecks,
  PenLine,
  CalendarClock,
  Plus,
  NotebookPen,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import { useAllQuestions, useReviewStates } from '@/hooks/useQuestions';
import { useCompanies } from '@/hooks/useCompanies';
import { useUIStore } from '@/store/ui';
import { AI_POLICY_LABEL } from '@/lib/constants';
import { currentStreak, totalStudyDays } from '@/lib/streak';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Flame;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const questions = useAllQuestions();
  const reviewStates = useReviewStates();
  const companies = useCompanies();
  const targetCompanyId = useUIStore((s) => s.targetCompanyId);
  const setTargetCompanyId = useUIStore((s) => s.setTargetCompanyId);
  const targetCompany = companies?.find((c) => c.id === targetCompanyId);

  const stats = useMemo(() => {
    const now = Date.now();
    const total = questions?.length ?? 0;
    const answered =
      questions?.filter((q) => q.personalAnswer?.trim()).length ?? 0;
    const due =
      questions?.filter((q) => {
        const r = reviewStates.get(q.id);
        return r && r.nextDue <= now;
      }) ?? [];
    const unseen =
      questions?.filter((q) => !reviewStates.get(q.id)).length ?? 0;
    const histogram = [0, 0, 0, 0, 0, 0];
    for (const q of questions ?? []) {
      const c = reviewStates.get(q.id)?.confidence ?? 0;
      histogram[c] += 1;
    }
    return { total, answered, due, unseen, histogram };
  }, [questions, reviewStates]);

  const streak = currentStreak();
  const studyDays = totalStudyDays();

  const dueSorted = useMemo(() => {
    const inTarget = (id: string) => {
      if (!targetCompany) return false;
      const q = questions?.find((x) => x.id === id);
      return !!q?.company?.some(
        (c) => c.toLowerCase() === targetCompany.name.toLowerCase(),
      );
    };
    return [...stats.due].sort((a, b) => {
      // target-company questions float to the top in active prep mode
      const ta = inTarget(a.id) ? 0 : 1;
      const tb = inTarget(b.id) ? 0 : 1;
      if (ta !== tb) return ta - tb;
      const ra = reviewStates.get(a.id)?.nextDue ?? 0;
      const rb = reviewStates.get(b.id)?.nextDue ?? 0;
      return ra - rb;
    });
  }, [stats.due, reviewStates, targetCompany, questions]);

  const recent = useMemo(
    () =>
      [...(questions ?? [])]
        .filter((q) => q.personalAnswer?.trim() || q.personalNotes?.trim())
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 8),
    [questions],
  );

  const maxHist = Math.max(1, ...stats.histogram);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {streak > 0
              ? `🔥 ${streak}-day streak — keep it going.`
              : 'Review a card today to start a streak.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/my-questions/new">
              <Plus className="size-4" /> Question
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/notes">
              <NotebookPen className="size-4" /> Note
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/stories">
              <BookOpen className="size-4" /> Story
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="Due today"
          value={stats.due.length}
          sub={`${stats.unseen} not yet started`}
        />
        <StatCard
          icon={ListChecks}
          label="Questions"
          value={stats.total}
          sub="in your bank"
        />
        <StatCard
          icon={PenLine}
          label="Answered"
          value={stats.answered}
          sub={`${Math.round((stats.answered / Math.max(1, stats.total)) * 100)}% have your answer`}
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={streak}
          sub={`${studyDays} total study days`}
        />
      </div>

      {/* Active prep mode */}
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Active prep mode</span>
          <div className="w-56">
            <Select
              value={targetCompanyId ?? 'none'}
              onValueChange={(v) =>
                setTargetCompanyId(v === 'none' ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No target company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No target company</SelectItem>
                {(companies ?? [])
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {targetCompany && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{AI_POLICY_LABEL[targetCompany.aiPolicy]}</span>
            <Button asChild size="sm" variant="outline">
              <Link to={`/companies/${targetCompany.id}`}>Open playbook</Link>
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Due queue */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today's review queue</h2>
            {dueSorted.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to={`/questions/${dueSorted[0].id}`}>
                  Start reviewing <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>
          {questions === undefined ? (
            <div className="h-40 animate-pulse rounded-xl border bg-muted/40" />
          ) : dueSorted.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nothing due right now. 🎉
              <div className="mt-3">
                <Button asChild size="sm" variant="outline">
                  <Link to="/questions">Browse the bank</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {dueSorted.slice(0, 12).map((q) => (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{q.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <RoundPill round={q.roundType} />
                      <DifficultyBadge difficulty={q.difficulty} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Confidence histogram + recent */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Confidence</h2>
            <Card className="space-y-2 p-4">
              {[5, 4, 3, 2, 1, 0].map((level) => (
                <div key={level} className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-muted-foreground">
                    {level === 0 ? 'Unseen' : `Level ${level}`}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded bg-emerald-500/70"
                      style={{
                        width: `${(stats.histogram[level] / maxHist) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums">
                    {stats.histogram[level]}
                  </span>
                </div>
              ))}
            </Card>
          </div>

          {recent.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Recent activity</h2>
              <Card className="divide-y">
                {recent.map((q) => (
                  <Link
                    key={q.id}
                    to={`/questions/${q.id}`}
                    className="block px-4 py-2 text-sm hover:bg-accent/40"
                  >
                    <span className="truncate">{q.title}</span>
                  </Link>
                ))}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
