import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Timer,
  Play,
  Pause,
  ChevronRight,
  Flag,
  Trash2,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/Markdown';
import { StarRating } from '@/components/StarRating';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUND_TYPES, ROUND_LABEL } from '@/lib/constants';
import { useAllQuestions } from '@/hooks/useQuestions';
import { useCompanies } from '@/hooks/useCompanies';
import { useMockSessions } from '@/hooks/useMockSessions';
import {
  pickMockQuestions,
  saveMockSession,
  deleteMockSession,
  formatDuration,
} from '@/lib/mock';
import type { Question, RoundType } from '@/types';

type Phase = 'setup' | 'running' | 'summary';
const DURATIONS = [15, 30, 45, 60, 90];

interface RoundResult {
  question: Question;
  scratchpad: string;
  rating: number;
  notes: string;
}

export default function Mock() {
  const questions = useAllQuestions();
  const companies = useCompanies();
  const sessions = useMockSessions();

  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedRounds, setSelectedRounds] = useState<RoundType[]>([
    'MACHINE_CODING',
    'FE_SYSTEM_DESIGN_COMPONENT',
    'BEHAVIORAL_BAR_RAISER',
  ]);
  const [duration, setDuration] = useState(60);
  const [companyId, setCompanyId] = useState<string>('none');

  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== 'running' || paused) return;
    tick.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [phase, paused]);

  const toggleRound = (r: RoundType) =>
    setSelectedRounds((s) =>
      s.includes(r) ? s.filter((x) => x !== r) : [...s, r],
    );

  const start = () => {
    if (!questions || selectedRounds.length === 0) return;
    const company = companies?.find((c) => c.id === companyId);
    const picked = pickMockQuestions(
      questions,
      selectedRounds,
      company?.name,
    );
    if (picked.length === 0) return;
    setRounds(
      picked.map((q) => ({ question: q, scratchpad: '', rating: 0, notes: '' })),
    );
    setCurrent(0);
    setStartedAt(Date.now());
    setRemaining(duration * 60 * 1000);
    setPaused(false);
    setPhase('running');
  };

  const updateRound = (patch: Partial<RoundResult>) =>
    setRounds((rs) =>
      rs.map((r, i) => (i === current ? { ...r, ...patch } : r)),
    );

  const next = () => {
    if (current < rounds.length - 1) setCurrent((c) => c + 1);
    else finish();
  };

  const finish = async () => {
    if (tick.current) clearInterval(tick.current);
    setPhase('summary');
  };

  const overallRating = useMemo(() => {
    const rated = rounds.filter((r) => r.rating > 0);
    if (!rated.length) return 0;
    return Math.round(
      rated.reduce((s, r) => s + r.rating, 0) / rated.length,
    );
  }, [rounds]);

  const [sessionNotes, setSessionNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const saveSession = async () => {
    const company = companies?.find((c) => c.id === companyId);
    const notesBlob = [
      sessionNotes && `Overall: ${sessionNotes}`,
      ...rounds.map(
        (r) =>
          `[${ROUND_LABEL[r.question.roundType]}] ${r.rating}/5 — ${r.question.title}${
            r.notes ? `: ${r.notes}` : ''
          }`,
      ),
    ]
      .filter(Boolean)
      .join('\n');
    await saveMockSession({
      startedAt,
      endedAt: Date.now(),
      roundTypes: rounds.map((r) => r.question.roundType),
      companyId: company?.id,
      selfRating: overallRating,
      notes: notesBlob,
    });
    setSaved(true);
  };

  const reset = () => {
    setPhase('setup');
    setRounds([]);
    setSessionNotes('');
    setSaved(false);
  };

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Timer className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">
            Mock Interview
          </h1>
        </div>

        <Card className="p-5">
          <Label className="text-sm font-semibold">Rounds</Label>
          <p className="mb-3 text-xs text-muted-foreground">
            One question will be drawn per selected round.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROUND_TYPES.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent/40"
              >
                <Checkbox
                  checked={selectedRounds.includes(r)}
                  onCheckedChange={() => toggleRound(r)}
                />
                {ROUND_LABEL[r]}
              </label>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Duration</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target company (optional)</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any company</SelectItem>
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

          <Button
            className="mt-5"
            onClick={start}
            disabled={selectedRounds.length === 0 || !questions}
          >
            <Play className="size-4" /> Start {selectedRounds.length}-round mock
          </Button>
        </Card>

        {/* History */}
        <div className="mt-8">
          <div className="mb-2 flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Past mocks</h2>
          </div>
          {sessions === undefined ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mocks yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <Card key={s.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {format(s.startedAt, 'd MMM yyyy, HH:mm')} ·{' '}
                        {s.roundTypes.length} rounds
                      </p>
                      <div className="mt-1">
                        <StarRating
                          value={s.selfRating ?? 0}
                          readOnly
                          size="sm"
                        />
                      </div>
                      {s.notes && (
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                          {s.notes}
                        </pre>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => deleteMockSession(s.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- RUNNING ----------
  if (phase === 'running') {
    const round = rounds[current];
    const timeUp = remaining <= 0;
    return (
      <div className="flex h-svh flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">
              Round {current + 1} / {rounds.length}
            </span>
            <RoundPill round={round.question.roundType} />
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-lg tabular-nums ${
                timeUp ? 'text-destructive' : ''
              }`}
            >
              {formatDuration(remaining)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={finish}>
              <Flag className="size-4" /> End
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          {/* Question */}
          <div className="overflow-y-auto border-r p-5">
            <div className="mb-2 flex items-center gap-1.5">
              <DifficultyBadge difficulty={round.question.difficulty} />
              {round.question.company?.map((c) => (
                <span
                  key={c}
                  className="rounded-md border px-2 py-0.5 text-xs"
                >
                  {c}
                </span>
              ))}
            </div>
            <h2 className="text-lg font-semibold">{round.question.title}</h2>
            <div className="mt-3">
              <Markdown>{round.question.body}</Markdown>
            </div>

            <div className="mt-6 border-t pt-4">
              <Label className="text-xs">Self-rate this round</Label>
              <div className="mt-1.5">
                <StarRating
                  value={round.rating}
                  onChange={(v) => updateRound({ rating: v })}
                />
              </div>
              <Textarea
                value={round.notes}
                onChange={(e) => updateRound({ notes: e.target.value })}
                placeholder="What went well / what to improve…"
                rows={2}
                className="mt-3"
              />
            </div>
          </div>

          {/* Scratchpad */}
          <div className="flex flex-col p-5">
            <Label className="mb-1.5 text-xs">Scratchpad</Label>
            <Textarea
              value={round.scratchpad}
              onChange={(e) => updateRound({ scratchpad: e.target.value })}
              placeholder="Work here — code, notes, diagrams in text…"
              className="flex-1 resize-none font-mono text-[13px]"
            />
            <Button className="mt-3 self-end" onClick={next}>
              {current < rounds.length - 1 ? (
                <>
                  Next round <ChevronRight className="size-4" />
                </>
              ) : (
                <>
                  Finish <Flag className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- SUMMARY ----------
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Mock complete</h1>
      <p className="text-sm text-muted-foreground">
        {rounds.length} rounds ·{' '}
        {formatDuration(duration * 60 * 1000 - remaining)} elapsed
      </p>

      <Card className="mt-4 p-5">
        <Label className="text-sm">Overall self-rating</Label>
        <div className="mt-1.5">
          <StarRating value={overallRating} readOnly />
        </div>

        <div className="mt-4 space-y-2">
          {rounds.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-md border p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {r.question.title}
                </p>
                <span className="text-xs text-muted-foreground">
                  {ROUND_LABEL[r.question.roundType]}
                </span>
              </div>
              <StarRating value={r.rating} readOnly size="sm" />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Label>Session notes</Label>
          <Textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Overall reflections…"
            rows={3}
            className="mt-1.5"
          />
        </div>

        <div className="mt-4 flex gap-2">
          {!saved ? (
            <Button onClick={saveSession}>Save to history</Button>
          ) : (
            <Button disabled variant="secondary">
              Saved ✓
            </Button>
          )}
          <Button variant="outline" onClick={reset}>
            {saved ? 'Done' : 'Discard'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
