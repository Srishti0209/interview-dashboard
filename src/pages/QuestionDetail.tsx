import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Pencil,
  Trash2,
  Sparkles,
  Columns2,
  Eye,
  EyeOff,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/Markdown';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { SaveStatus } from '@/components/SaveStatus';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import { ReviewControls } from '@/components/questions/ReviewControls';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuestion } from '@/hooks/useQuestions';
import { useLinkedNotes } from '@/hooks/useNotes';
import { useAutosave } from '@/hooks/useAutosave';
import { updateQuestion, toggleBookmark, deleteQuestion } from '@/lib/questions';
import { buildPracticePrompt, claudeUrl, chatgptUrl } from '@/lib/ai';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = useQuestion(id);
  const linkedNotes = useLinkedNotes(id);
  const hideAnswers = useUIStore((s) => s.hideAnswers);

  const isUser = question?.source === 'user';
  const hasModel = !!question?.answer?.trim();
  const hasPersonal = !!question?.personalAnswer?.trim();

  const [tab, setTab] = useState<string>('my');
  const [compare, setCompare] = useState(false);
  const [revealModel, setRevealModel] = useState(!hideAnswers);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Pick default tab once the question loads.
  useEffect(() => {
    if (!question) return;
    setTab(hasPersonal ? 'my' : hasModel ? 'model' : 'my');
    setRevealModel(!hideAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const answer = useAutosave(
    question?.personalAnswer ?? '',
    (v) => (id ? updateQuestion(id, { personalAnswer: v }) : undefined),
  );
  const notes = useAutosave(
    question?.personalNotes ?? '',
    (v) => (id ? updateQuestion(id, { personalNotes: v }) : undefined),
  );

  const practicePrompt = useMemo(
    () => (question ? buildPracticePrompt(question) : ''),
    [question],
  );

  // E = edit (user questions), B = bookmark — when not typing.
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
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'b' && question) {
        e.preventDefault();
        void toggleBookmark(question.id);
      } else if (e.key === 'e' && isUser && question) {
        e.preventDefault();
        navigate(`/my-questions/new?edit=${question.id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, isUser, navigate]);

  if (question === undefined) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-40 animate-pulse rounded bg-muted/60" />
      </div>
    );
  }
  if (question === null) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">Question not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/questions">Back to Question Bank</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 gap-1 text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Bookmark"
            onClick={() => toggleBookmark(question.id)}
          >
            <Bookmark
              className={cn(
                'size-4',
                question.bookmarked && 'fill-amber-400 text-amber-500',
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="size-4" /> Practice with AI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a
                  href={claudeUrl(practicePrompt)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Claude
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={chatgptUrl(practicePrompt)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in ChatGPT
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isUser && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={() => navigate(`/my-questions/new?edit=${question.id}`)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{question.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <RoundPill round={question.roundType} />
        <DifficultyBadge difficulty={question.difficulty} />
        {question.company?.map((c) => (
          <Badge key={c} variant="outline" className="font-normal">
            {c}
          </Badge>
        ))}
        {question.source === 'user' && (
          <Badge variant="muted" className="font-normal">
            My question
          </Badge>
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Question
        </h2>
        <Markdown>{question.body}</Markdown>
        {question.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {question.tags.map((t) => (
              <Badge key={t} variant="secondary" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="my">My Answer</TabsTrigger>
            {hasModel && <TabsTrigger value="model">Model Answer</TabsTrigger>}
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* My Answer */}
          <TabsContent value="my">
            <div className="mb-2 flex items-center justify-between">
              <SaveStatus status={answer.status} />
              {hasModel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setCompare((c) => !c)}
                >
                  <Columns2 className="size-3.5" />
                  {compare ? 'Hide comparison' : 'Compare to model answer'}
                </Button>
              )}
            </div>
            {compare && hasModel ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Your answer
                  </p>
                  <MarkdownEditor
                    value={answer.value}
                    onChange={answer.onChange}
                    onBlur={answer.flush}
                    placeholder="Write your answer in your own words…"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Model answer
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <Markdown>{question.answer ?? ''}</Markdown>
                  </div>
                </div>
              </div>
            ) : (
              <MarkdownEditor
                value={answer.value}
                onChange={answer.onChange}
                onBlur={answer.flush}
                placeholder="Write your answer in your own words…"
              />
            )}
          </TabsContent>

          {/* Model Answer */}
          {hasModel && (
            <TabsContent value="model">
              <div className="mb-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setRevealModel((r) => !r)}
                >
                  {revealModel ? (
                    <>
                      <EyeOff className="size-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" /> Reveal
                    </>
                  )}
                </Button>
              </div>
              {revealModel ? (
                <div className="rounded-lg border bg-card p-4">
                  <Markdown>{question.answer ?? ''}</Markdown>
                </div>
              ) : (
                <button
                  onClick={() => setRevealModel(true)}
                  className="flex min-h-32 w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-accent/40"
                >
                  Answer hidden — click to reveal
                </button>
              )}
            </TabsContent>
          )}

          {/* Notes */}
          <TabsContent value="notes">
            <div className="mb-2">
              <SaveStatus status={notes.status} />
            </div>
            <Textarea
              value={notes.value}
              onChange={(e) => notes.onChange(e.target.value)}
              onBlur={notes.flush}
              placeholder="Scratchpad: hints, gotchas, links to remember…"
              rows={8}
              className="font-mono text-[13px]"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Linked notes */}
      {linkedNotes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Linked notes
          </h2>
          <div className="space-y-2">
            {linkedNotes.map((n) => (
              <Link
                key={n.id}
                to={`/notes/${n.id}`}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="truncate font-medium">
                  {n.title || 'Untitled note'}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Review controls */}
      <section className="mt-8">
        <ReviewControls questionId={question.id} />
      </section>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this question?</DialogTitle>
            <DialogDescription>
              This permanently removes “{question.title}” and its review history.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteQuestion(question.id);
                navigate('/questions');
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
