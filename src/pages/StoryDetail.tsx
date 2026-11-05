import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Clock, Loader2, MessagesSquare, Pencil, Save, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useStories } from '@/hooks/useStories';
import { StoryCritic } from '@/components/stories/StoryCritic';
import { updateStory } from '@/lib/stories';
import { cn } from '@/lib/utils';
import type { DeepDiveItem, Story, StoryBeat } from '@/types';

/** Seconds to say `text` at a steady interview pace (150 words a minute). */
function speakingSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60);
}

function Timing({ text, target }: { text: string; target: number }) {
  const secs = speakingSeconds(text);
  const long = secs > target * 1.3;
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[11px]', long ? 'text-amber-600' : 'text-muted-foreground')}
      title={long ? `Aim for about ${target}s` : undefined}
    >
      <Clock className="size-3" /> ~{secs}s{long ? ` (aim ~${target}s)` : ` / ${target}s`}
    </span>
  );
}

export default function StoryDetail() {
  const { id } = useParams();
  const stories = useStories();
  const story = stories?.find((s) => s.id === id);
  if (stories === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!story) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm">
        Story not found. <Link className="underline" to="/stories">Back to the Story Bank</Link>
      </div>
    );
  }
  return <Detail key={story.id} story={story} />;
}

interface EditState {
  title: string;
  situation: string;
  task: string;
  beats: StoryBeat[];
  result: string;
  reflection: string;
  short30: string;
  long2min: string;
  deepDive: DeepDiveItem[];
}

function Detail({ story }: { story: Story }) {
  const navigate = useNavigate();
  const d = story.details ?? {};
  const rich = !!d.beats?.length;
  const [editing, setEditing] = useState<EditState | null>(null);
  const inProgress = !!d.builder?.turns?.some((t) => t.role === 'user') && !rich;

  const startEdit = () =>
    setEditing({
      title: story.title,
      situation: story.situation,
      task: story.task,
      beats: d.beats?.length ? d.beats : [{ name: 'Action', text: story.action }],
      result: story.result,
      reflection: d.reflection ?? '',
      short30: d.short30 ?? '',
      long2min: d.long2min ?? '',
      deepDive: d.deepDive ?? [],
    });

  const save = async () => {
    if (!editing) return;
    const beats = editing.beats.filter((b) => b.text.trim());
    await updateStory(story.id, {
      title: editing.title.trim() || story.title,
      situation: editing.situation,
      task: editing.task,
      action: beats.map((b) => (beats.length > 1 || b.name !== 'Action' ? `${b.name}: ${b.text}` : b.text)).join('\n'),
      result: editing.result,
      isDraft: false,
      details: {
        ...d,
        beats: rich || beats.length > 1 ? beats : d.beats,
        reflection: editing.reflection,
        short30: editing.short30,
        long2min: editing.long2min,
        deepDive: editing.deepDive.filter((q) => q.question.trim()),
      },
    });
    setEditing(null);
  };

  const field = (key: keyof EditState, label: string, rows = 3) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Textarea
        rows={rows}
        value={editing![key] as string}
        onChange={(e) => setEditing((s) => s && { ...s, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6" data-testid="story-detail">
      <Link to="/stories" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Story Bank
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <Input
              aria-label="Title"
              value={editing.title}
              onChange={(e) => setEditing((s) => s && { ...s, title: e.target.value })}
              className="text-lg font-semibold"
            />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight">{story.title}</h1>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {typeof d.score === 'number' && (
              <Badge className="font-normal" data-testid="story-score">
                {d.score}/10
              </Badge>
            )}
            {story.isDraft && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Sparkles className="size-3" /> AI draft
              </Badge>
            )}
            {(d.bestFor ?? story.applicableTo).map((c) => (
              <Badge key={c} variant="outline" className="font-normal">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save}>
                <Save /> Save
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Pencil /> Edit
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/stories/${story.id}/build${rich && d.gaps?.length ? '?gaps=1' : ''}`)}
              >
                <MessagesSquare /> {inProgress ? 'Continue building' : rich ? 'Deepen more' : 'Deepen with Builder'}
              </Button>
            </>
          )}
        </div>
      </div>

      {!rich && !editing && (
        <Card className="mb-4 flex gap-2 border-violet-500/30 bg-violet-500/5 p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-600" />
          <span>
            This is a basic draft. Deepen it with the Story Builder: a short interview that adds your decisions, the
            alternatives you rejected, numbers, a reflection and answers to likely follow-up questions.
          </span>
        </Card>
      )}

      {editing ? (
        <Card className="space-y-4 p-4">
          {field('situation', 'Situation (~15s)')}
          {field('task', 'Task (~10s)', 2)}
          <div className="space-y-2">
            <span className="text-xs font-medium">Action beats (~60s in total)</span>
            {editing.beats.map((b, i) => (
              <div key={i} className="space-y-1 rounded-md border p-2">
                <Input
                  aria-label={`Beat ${i + 1} name`}
                  value={b.name}
                  onChange={(e) =>
                    setEditing((s) => s && { ...s, beats: s.beats.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })
                  }
                />
                <Textarea
                  aria-label={`Beat ${i + 1}`}
                  rows={3}
                  value={b.text}
                  onChange={(e) =>
                    setEditing((s) => s && { ...s, beats: s.beats.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })
                  }
                />
              </div>
            ))}
            {editing.beats.length < 3 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing((s) => s && { ...s, beats: [...s.beats, { name: `Beat ${s.beats.length + 1}`, text: '' }] })}
              >
                Add a beat
              </Button>
            )}
          </div>
          {field('result', 'Result (~10s)', 2)}
          {field('reflection', 'Reflection (~10s)', 2)}
          {field('short30', '30-second version')}
          {field('long2min', '2-minute version', 6)}
          <div className="space-y-2">
            <span className="text-xs font-medium">Deep-dive prep</span>
            {editing.deepDive.map((q, i) => (
              <div key={i} className="space-y-1 rounded-md border p-2">
                <Input
                  aria-label={`Question ${i + 1}`}
                  value={q.question}
                  onChange={(e) =>
                    setEditing((s) => s && { ...s, deepDive: s.deepDive.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })
                  }
                />
                <Textarea
                  aria-label={`Answer ${i + 1}`}
                  rows={2}
                  value={q.answer}
                  onChange={(e) =>
                    setEditing((s) => s && { ...s, deepDive: s.deepDive.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })
                  }
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing((s) => s && { ...s, deepDive: [...s.deepDive, { question: '', answer: '' }] })}
            >
              Add a question
            </Button>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="full">
          {rich && (
            <TabsList className="mb-3">
              <TabsTrigger value="full">Full story</TabsTrigger>
              <TabsTrigger value="short">30 seconds</TabsTrigger>
              <TabsTrigger value="long">2 minutes</TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="full" className="space-y-3">
            <Section title="Situation" text={story.situation} target={15} />
            <Section title="Task" text={story.task} target={10} />
            {rich ? (
              <Card className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Action</h2>
                  <Timing text={d.beats!.map((b) => b.text).join(' ')} target={60} />
                </div>
                {d.beats!.map((b, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-muted-foreground">
                      Beat {i + 1}: {b.name}
                    </p>
                    <p className="text-sm">{b.text}</p>
                  </div>
                ))}
              </Card>
            ) : (
              <Section title="Action" text={story.action} target={60} />
            )}
            <Section title="Result" text={story.result} target={10} />
            {d.reflection && <Section title="Reflection" text={d.reflection} target={10} />}
            {story.metrics && (
              <p className="text-sm">
                <span className="font-medium">Metrics: </span>
                {story.metrics}
              </p>
            )}
          </TabsContent>
          {rich && (
            <>
              <TabsContent value="short">
                <Section title="30-second version" text={d.short30 ?? ''} target={30} />
              </TabsContent>
              <TabsContent value="long">
                <Section title="2-minute version" text={d.long2min ?? ''} target={120} />
              </TabsContent>
            </>
          )}
        </Tabs>
      )}

      {!editing && (
        <div className="mt-4 space-y-3">
          <StoryCritic story={story} />
          {!!d.deepDive?.length && (
            <Card className="p-4" data-testid="deep-dive">
              <h2 className="mb-2 text-sm font-semibold">Deep-dive prep</h2>
              <div className="space-y-2">
                {d.deepDive.map((q, i) => (
                  <details key={i} className="rounded-md border p-2 text-sm">
                    <summary className="cursor-pointer font-medium">{q.question}</summary>
                    <p className="mt-1.5 text-muted-foreground">{q.answer}</p>
                  </details>
                ))}
              </div>
            </Card>
          )}
          {(d.people || d.whatWentWrong) && (
            <Card className="space-y-2 p-4 text-sm">
              {d.people && (
                <p>
                  <span className="font-medium">Who else was involved: </span>
                  {d.people}
                </p>
              )}
              {d.whatWentWrong && (
                <p>
                  <span className="font-medium">What went wrong: </span>
                  {d.whatWentWrong}
                </p>
              )}
            </Card>
          )}
          {!!d.gaps?.length && (
            <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                <AlertTriangle className="size-4 text-amber-600" /> Still to fill in
              </h2>
              <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                {d.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, text, target }: { title: string; text: string; target: number }) {
  if (!text.trim()) return null;
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Timing text={text} target={target} />
      </div>
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </Card>
  );
}
