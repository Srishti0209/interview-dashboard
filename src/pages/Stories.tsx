import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Wand2, Pencil, Trash2, Check, FileUp, PenLine, Sparkles, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StoryDialog } from '@/components/stories/StoryDialog';
import { CoverageMatrix } from '@/components/stories/CoverageMatrix';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FromResume } from '@/components/stories/FromResume';
import { GenerateFromResume } from '@/components/resume/GenerateFromResume';
import { useStories } from '@/hooks/useStories';
import { useActiveResume } from '@/hooks/useResume';
import { matchStories, deleteStory, updateStory, createStory, emptyStory, UNTITLED_STORY } from '@/lib/stories';
import { QUICK_STEPS, completedSteps, useQuickDraftsStore } from '@/lib/storyAi/quickDrafts';
import type { Story } from '@/types';

function StoryCard({
  story,
  onEdit,
  onDelete,
  highlight,
}: {
  story: Story;
  onEdit: () => void;
  onDelete: () => void;
  highlight?: string[];
}) {
  const rows: [string, string][] = [
    ['Situation', story.situation],
    ['Task', story.task],
    ['Action', story.action],
    ['Result', story.result],
    ['Metrics', story.metrics],
  ];
  const gaps = story.details?.gaps ?? [];
  // Written up by the Story Builder at least once.
  const deepened = !!story.details?.beats?.length;
  return (
    <Card className="p-4" data-testid="story-card">
      {story.isDraft && (
        <Badge variant="outline" className="mb-2 gap-1 border-violet-500/40 font-normal text-violet-700 dark:text-violet-300">
          <Sparkles className="size-3" /> AI draft
        </Badge>
      )}
      <div className="flex items-start gap-2">
        <h3 className="font-semibold leading-snug">
          <Link to={`/stories/${story.id}`} className="hover:underline">
            {story.title}
          </Link>
        </h3>
        {typeof story.details?.score === 'number' && (
          <Badge className="shrink-0 font-normal">{story.details.score}/10</Badge>
        )}
      </div>
      {/* -ml-2 lines the ghost buttons' labels up with the title. */}
      <div className="-ml-2 mt-1.5 flex flex-wrap items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          asChild
          title={deepened ? 'Fill in the gaps with the Story Builder' : 'Deepen with the Story Builder'}
        >
          <Link to={`/stories/${story.id}/build${deepened && gaps.length ? '?gaps=1' : ''}`}>
            <MessagesSquare className="size-3.5" /> {deepened ? 'Deepen more' : 'Deepen'}
          </Link>
        </Button>
        {story.isDraft && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            title="Keep this draft as a story"
            onClick={() => void updateStory(story.id, { isDraft: false })}
          >
            <Check className="size-3.5" /> Keep
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        {rows.map(
          ([label, val]) =>
            val && (
              <p key={label}>
                <span className="font-medium text-muted-foreground">
                  {label}:{' '}
                </span>
                {val}
              </p>
            ),
        )}
      </div>

      {gaps.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
          <p className="mb-1 font-medium">Fill in to make this story strong:</p>
          <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {(story.tags.length > 0 || story.applicableTo.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {story.tags.map((t) => (
            <Badge
              key={t}
              variant={highlight?.includes(t.toLowerCase()) ? 'default' : 'secondary'}
              className="font-normal"
            >
              {t}
            </Badge>
          ))}
          {story.applicableTo.map((t) => (
            <Badge
              key={'a-' + t}
              variant={
                highlight?.includes(t.toLowerCase()) ? 'default' : 'outline'
              }
              className="font-normal"
            >
              {t}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Stories() {
  const stories = useStories();
  const navigate = useNavigate();
  // A blank story for the Story Builder to fill in, optionally aimed at a
  // competency (coverage gaps).
  const buildNew = async (competency?: string) => {
    const id = await createStory({ ...emptyStory, title: UNTITLED_STORY, source: 'user', isDraft: true });
    navigate(`/stories/${id}/build${competency ? `?for=${encodeURIComponent(competency)}` : ''}`);
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Story | null>(null);
  const [matcherText, setMatcherText] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const resume = useActiveResume().data;
  const resumeRun = useQuickDraftsStore((s) => (resume ? s.runs[resume.id] : undefined));
  const resumeSteps = useQuery({
    queryKey: ['quick-drafts-done', resume?.id, resumeRun?.status],
    queryFn: () => completedSteps(resume!.id),
    enabled: !!resume && !!stories?.length,
  }).data;
  // Offer drafts while the active resume's run is incomplete (never started,
  // or stopped part-way), and keep a run's progress on screen.
  const showResumeBanner =
    !!resume &&
    !!stories?.length &&
    (!!resumeRun || (!!resumeSteps && resumeSteps.length < QUICK_STEPS.length));

  const tagSuggestions = useMemo(() => {
    const s = new Set<string>();
    for (const st of stories ?? []) {
      st.tags.forEach((t) => s.add(t));
      st.applicableTo.forEach((t) => s.add(t));
    }
    return [...s].sort();
  }, [stories]);

  const matches = useMemo(
    () =>
      matcherText.trim()
        ? matchStories(matcherText, stories ?? [])
        : [],
    [matcherText, stories],
  );
  const matchedWords = matches.flatMap((m) => m.matched);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (s: Story) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const shown =
    matcherText.trim() && matches.length
      ? matches.map((m) => m.story)
      : (stories ?? []);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Story Bank</h1>
          <p className="text-sm text-muted-foreground">
            Behavioral stories in STAR format.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
            <FileUp className="size-4" /> Upload new resume
          </Button>
          <Button size="sm" variant="outline" onClick={() => buildNew()}>
            <MessagesSquare className="size-4" /> Build a story
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4" /> New story
          </Button>
        </div>
      </div>

      {showResumeBanner && resume && (
        <Card className="mb-6 p-4" data-testid="resume-banner">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Draft stories from your resume</h2>
          </div>
          <GenerateFromResume resume={resume} onStoryBank />
        </Card>
      )}

      <Tabs defaultValue="stories">
        <TabsList className="mb-4">
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>
        <TabsContent value="coverage">
          <CoverageMatrix stories={stories ?? []} onBuild={(c) => void buildNew(c)} />
        </TabsContent>
        <TabsContent value="stories">
          {/* Matcher */}
          <Card className="mb-6 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Story matcher</h2>
            </div>
            <Textarea
              value={matcherText}
              onChange={(e) => setMatcherText(e.target.value)}
              placeholder="Paste a behavioral question — e.g. 'Tell me about a time you disagreed with your manager about a deadline.'"
              rows={2}
            />
            {matcherText.trim() && (
              <p className="mt-2 text-xs text-muted-foreground">
                {matches.length === 0
                  ? 'No matching stories. Consider adding one for this theme.'
                  : `${matches.length} matching ${matches.length === 1 ? 'story' : 'stories'}, best first.`}
              </p>
            )}
          </Card>

          {/* Grid */}
          {stories === undefined ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="stories-empty">
              <Card className="p-5">
                <div className="mb-1 flex items-center gap-2">
                  <FileUp className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">Start from your resume</h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Get 8–12 draft STAR stories and the questions interviewers are likely to ask about your
                  career. You then deepen each draft with the detail a resume leaves out.
                </p>
                <FromResume />
              </Card>
              <Card className="p-5">
                <div className="mb-1 flex items-center gap-2">
                  <PenLine className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">Write a story yourself</h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Let the Story Builder interview you, stage by stage, with tips and examples. Or write a quick STAR
                  story yourself.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => buildNew()}>
                    <MessagesSquare className="size-4" /> Build with the Story Builder
                  </Button>
                  <Button size="sm" variant="outline" onClick={openNew}>
                    <Plus className="size-4" /> Write it myself
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {shown.map((s) => (
                <StoryCard
                  key={s.id}
                  story={s}
                  highlight={matchedWords}
                  onEdit={() => openEdit(s)}
                  onDelete={() => setConfirmDelete(s)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <StoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        story={editing}
        tagSuggestions={tagSuggestions}
      />

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload a new resume</DialogTitle>
            <DialogDescription>
              It becomes your active resume. New drafts are added alongside your existing stories,
              which are never changed.
            </DialogDescription>
          </DialogHeader>
          {uploadOpen && <FromResume newUpload onCancel={() => setUploadOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete story?</DialogTitle>
            <DialogDescription>
              This permanently deletes “{confirmDelete?.title}”.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmDelete) await deleteStory(confirmDelete.id);
                setConfirmDelete(null);
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
