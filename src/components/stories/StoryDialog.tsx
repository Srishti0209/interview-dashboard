import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TokenInput } from '@/components/TokenInput';
import { createStory, updateStory, emptyStory } from '@/lib/stories';
import type { Story } from '@/types';

const FIELDS: { key: keyof typeof emptyStory; label: string; rows: number }[] = [
  { key: 'situation', label: 'Situation', rows: 2 },
  { key: 'task', label: 'Task', rows: 2 },
  { key: 'action', label: 'Action', rows: 3 },
  { key: 'result', label: 'Result', rows: 2 },
  { key: 'metrics', label: 'Metrics / impact', rows: 2 },
];

export function StoryDialog({
  open,
  onOpenChange,
  story,
  tagSuggestions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  story?: Story | null;
  tagSuggestions: string[];
}) {
  const [draft, setDraft] = useState({ ...emptyStory });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(
        story
          ? {
              title: story.title,
              situation: story.situation,
              task: story.task,
              action: story.action,
              result: story.result,
              metrics: story.metrics,
              applicableTo: story.applicableTo,
              tags: story.tags,
            }
          : { ...emptyStory },
      );
    }
  }, [open, story]);

  const set = (k: keyof typeof draft, v: unknown) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      if (story) await updateStory(story.id, draft);
      else await createStory(draft);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{story ? 'Edit story' : 'New story'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="story-title">Title *</Label>
            <Input
              id="story-title"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Shipped the streaming rewrite under deadline"
              className="mt-1.5"
            />
          </div>

          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Textarea
                value={draft[f.key] as string}
                onChange={(e) => set(f.key, e.target.value)}
                rows={f.rows}
                className="mt-1.5"
              />
            </div>
          ))}

          <div>
            <Label>Tags</Label>
            <div className="mt-1.5">
              <TokenInput
                value={draft.tags}
                onChange={(v) => set('tags', v)}
                suggestions={tagSuggestions}
                placeholder="leadership, conflict, ambiguity…"
              />
            </div>
          </div>

          <div>
            <Label>Applicable to (question themes)</Label>
            <div className="mt-1.5">
              <TokenInput
                value={draft.applicableTo}
                onChange={(v) => set('applicableTo', v)}
                suggestions={tagSuggestions}
                placeholder="failure, disagreement, deadline…"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !draft.title.trim()}>
            {story ? 'Save changes' : 'Create story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
