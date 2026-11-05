import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArchiveRestore, ArrowLeft, EyeOff, Loader2, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Markdown } from '@/components/Markdown';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { TokenInput } from '@/components/TokenInput';
import { useAllQuestions, useFacets } from '@/hooks/useQuestions';
import { useSession } from '@/hooks/useSession';
import {
  deleteForever,
  fetchQuestionVersions,
  fetchSharedQuestion,
  moveToBin,
  restoreFromBin,
  restoreVersion,
  saveSharedQuestion,
  type AdminQuestion,
  type AdminQuestionInput,
} from '@/lib/admin';
import {
  DIFFICULTIES,
  ROLE_FAMILIES,
  ROLE_FAMILY_LABEL,
  ROUND_LABEL,
  ROUND_TYPES,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Difficulty, RoleFamily, RoleLevel, RoundType } from '@/types';

const LEVELS: [RoleLevel, string][] = [
  ['mid', 'Mid'],
  ['senior', 'Senior'],
  ['staff', 'Staff'],
];

const EMPTY: AdminQuestionInput = {
  title: '',
  body: '',
  answer: '',
  roundType: 'BEHAVIORAL_BAR_RAISER',
  difficulty: 'medium',
  roleFamilies: [],
  levels: [],
  company: [],
  tags: [],
  status: 'draft',
};

/** /admin/questions/new and /admin/questions/:id */
export default function AdminQuestionEdit() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-question', id],
    queryFn: () => fetchSharedQuestion(id!),
    enabled: !isNew,
    staleTime: 0,
  });
  // Held here: saving (and creating, which moves to the new URL) re-creates
  // the Editor below.
  // Which question the "Saved" note belongs to (a new one has its id by then).
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const setSaved = (qid: string | null) => setSavedFor(qid);

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isNew && (error || !data)) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm">
        <BackLink />
        <p className="mt-4 text-destructive">
          {error ? (error as Error).message : 'Question not found.'}
        </p>
      </div>
    );
  }
  // Keyed on the saved version, so a fresher copy than the cached one
  // replaces what the form shows.
  return (
    <Editor
      key={isNew ? 'new' : `${id}:${data!.updatedAt}`}
      question={isNew ? null : data!}
      saved={!isNew && savedFor === id}
      setSaved={setSaved}
    />
  );
}

function BackLink() {
  return (
    <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Admin
    </Link>
  );
}

function Editor({
  question,
  saved,
  setSaved,
}: {
  question: AdminQuestion | null;
  saved: boolean;
  setSaved: (questionId: string | null) => void;
}) {
  const navigate = useNavigate();
  const { tags: tagSuggestions, companies: companySuggestions } = useFacets(useAllQuestions());
  const [form, setForm] = useState<AdminQuestionInput>(question ?? EMPTY);
  const [busy, setBusy] = useState<'save' | 'hide' | 'bin' | 'restore' | 'forever' | null>(null);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof AdminQuestionInput>(key: K, value: AdminQuestionInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(null);
  };
  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const problems = [
    !form.title.trim() && 'Add a title.',
    !form.body.trim() && 'Add the prompt.',
    form.roleFamilies.length === 0 && 'Pick at least one role.',
  ].filter(Boolean) as string[];

  const save = async (next: AdminQuestionInput, action: 'save' | 'hide') => {
    setTouched(true);
    if (problems.length) return;
    setBusy(action);
    setError('');
    try {
      const savedId = await saveSharedQuestion(next, question?.id);
      setForm(next);
      setSaved(savedId);
      if (!question) navigate(`/admin/questions/${savedId}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  /** Runs a bin action; `leave` goes back to the list afterwards. */
  const binAction = async (
    action: 'bin' | 'restore' | 'forever',
    run: (id: string) => Promise<void>,
    leave: boolean,
  ) => {
    if (!question) return;
    setBusy(action);
    setError('');
    try {
      await run(question.id);
      if (leave) navigate('/admin', { replace: true });
      else setBusy(null);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  };
  const toBin = () =>
    window.confirm(
      `Move "${question?.title}" to the bin?\n\nIt disappears for users, but their answers and notes on it are kept. You can restore it from the Bin tab at any time.`,
    ) && void binAction('bin', moveToBin, true);
  const forever = () =>
    window.confirm(
      `Delete "${question?.title}" forever?\n\nThis also permanently deletes every user's answer, notes and review progress for this question. It can't be undone.`,
    ) && void binAction('forever', deleteForever, true);

  const published = form.status === 'approved';

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <BackLink />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{question ? 'Edit question' : 'New question'}</h1>
        {question && <p className="font-mono text-xs text-muted-foreground">{question.id}</p>}
      </div>

      {question?.deletedAt && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="in-bin">
          <span className="flex-1">In the bin: hidden from users. Their answers on it are kept.</span>
          <Button size="sm" variant="outline" disabled={busy !== null}
            onClick={() => void binAction('restore', restoreFromBin, false)}>
            {busy === 'restore' ? <Loader2 className="animate-spin" /> : <ArchiveRestore />}
            Restore
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null} onClick={forever}>
            {busy === 'forever' ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete forever
          </Button>
        </div>
      )}

      <Card className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="q-title">Title</Label>
          <Input id="q-title" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Prompt</Label>
          <MarkdownEditor value={form.body} onChange={(v) => set('body', v)} minRows={4}
            placeholder="The question as the interviewer asks it (Markdown)…" />
        </div>
        <div className="space-y-1.5">
          <Label>Model answer</Label>
          <MarkdownEditor value={form.answer} onChange={(v) => set('answer', v)} minRows={16}
            placeholder="The model answer (Markdown)…" />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Round</Label>
            <Select value={form.roundType} onValueChange={(v) => set('roundType', v as RoundType)}>
              <SelectTrigger aria-label="Round"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUND_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>{ROUND_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={form.difficulty} onValueChange={(v) => set('difficulty', v as Difficulty)}>
              <SelectTrigger aria-label="Difficulty" className="capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ChipGroup
          label="Roles (whose Question Bank it appears in)"
          options={ROLE_FAMILIES.map((r) => [r, ROLE_FAMILY_LABEL[r]])}
          selected={form.roleFamilies}
          onToggle={(r) => set('roleFamilies', toggle(form.roleFamilies, r as RoleFamily))}
        />
        <ChipGroup
          label="Levels (leave empty for all)"
          options={LEVELS}
          selected={form.levels}
          onToggle={(l) => set('levels', toggle(form.levels, l as RoleLevel))}
        />

        <div className="space-y-1.5">
          <Label>Companies</Label>
          <TokenInput value={form.company} onChange={(v) => set('company', v)}
            suggestions={companySuggestions} placeholder="Add a company and press Enter…" />
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <TokenInput value={form.tags} onChange={(v) => set('tags', v)}
            suggestions={tagSuggestions} placeholder="Add a tag and press Enter…" />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <Label htmlFor="q-published">Published</Label>
            <p className="text-xs text-muted-foreground">
              {published
                ? 'Visible in the Question Bank of users with these roles.'
                : 'Draft: only admins can see it.'}
            </p>
          </div>
          <Switch id="q-published" checked={published}
            onCheckedChange={(on) => set('status', on ? 'approved' : 'draft')} />
        </div>
      </Card>

      {touched && problems.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-destructive">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void save(form, 'save')} disabled={busy !== null}>
          {busy === 'save' ? <Loader2 className="animate-spin" /> : <Save />}
          {question ? 'Save changes' : 'Create question'}
        </Button>
        {saved && (
          <span className="text-sm text-muted-foreground">
            Saved{published ? ' and live for users' : ' as a draft'}.
          </span>
        )}
        {question && !question.deletedAt && (
          <div className="ml-auto flex gap-2">
            {published && (
              <Button variant="outline" disabled={busy !== null}
                onClick={() => void save({ ...form, status: 'draft' }, 'hide')}>
                {busy === 'hide' ? <Loader2 className="animate-spin" /> : <EyeOff />}
                Move to draft (hide)
              </Button>
            )}
            <Button variant="ghost" className="text-destructive" disabled={busy !== null} onClick={toBin}>
              {busy === 'bin' ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Move to bin
            </Button>
          </div>
        )}
      </div>

      {question && <History questionId={question.id} onRestored={() => setSaved(question.id)} />}
    </div>
  );
}

/** Earlier versions of the question, each restorable. */
function History({ questionId, onRestored }: { questionId: string; onRestored: () => void }) {
  const me = useSession()?.user.id;
  const { data: versions, isLoading } = useQuery({
    queryKey: ['admin-question-versions', questionId],
    queryFn: () => fetchQuestionVersions(questionId),
    staleTime: 0,
  });
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');

  const restore = async (id: number, version: AdminQuestion) => {
    if (!window.confirm('Restore this version? The current version is kept in the history.')) return;
    setBusy(id);
    setError('');
    try {
      await restoreVersion(questionId, version);
      onRestored();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="space-y-3 p-5" data-testid="history">
      <div>
        <h2 className="text-sm font-semibold">History</h2>
        <p className="text-xs text-muted-foreground">
          The question as it was before each change made in the admin panel.
        </p>
      </div>
      {isLoading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : !versions?.length ? (
        <p className="text-sm text-muted-foreground">No earlier versions yet.</p>
      ) : (
        <ul className="divide-y">
          {versions.map((v) => (
            <li key={v.id} className="space-y-2 py-2" data-testid="version">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex-1">
                  {new Date(v.createdAt).toLocaleString()}
                  <span className="text-muted-foreground">
                    {' '}· changed by {v.changedBy === me ? 'you' : 'another admin'}
                    {v.question.deletedAt ? ' · was in the bin' : v.question.status === 'draft' ? ' · was a draft' : ''}
                  </span>
                </span>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen(open === v.id ? null : v.id)}>
                  {open === v.id ? 'Hide' : 'View'}
                </Button>
                <Button size="sm" variant="outline" className="h-7" disabled={busy !== null}
                  onClick={() => void restore(v.id, v.question)}>
                  {busy === v.id ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                  Restore
                </Button>
              </div>
              {open === v.id && (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">{v.question.title}</p>
                  <Markdown>{v.question.body}</Markdown>
                  <hr />
                  <Markdown>{v.question.answer || '_No model answer._'}</Markdown>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: [string, string][];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([value, text]) => {
          const on = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {text}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
