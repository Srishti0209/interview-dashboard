import { useMemo, useState } from 'react';
import { Plus, Wand2, Pencil, Trash2, BookOpen } from 'lucide-react';
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
import { useStories } from '@/hooks/useStories';
import { matchStories, deleteStory } from '@/lib/stories';
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
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{story.title}</h3>
        <div className="flex shrink-0 gap-0.5">
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Story | null>(null);
  const [matcherText, setMatcherText] = useState('');

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
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New story
        </Button>
      </div>

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
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <BookOpen className="mx-auto mb-2 size-8 opacity-40" />
          No stories yet.
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

      <StoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        story={editing}
        tagSuggestions={tagSuggestions}
      />

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
