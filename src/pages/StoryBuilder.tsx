import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { HandOffPanel } from '@/components/ai/HandOffPanel';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useProfile } from '@/hooks/useProfile';
import { useStoriesQuery } from '@/hooks/useStories';
import { roleTitle } from '@/lib/constants';
import { AiError, aiPost, aiStream } from '@/lib/storyAi/client';
import { builderHandOffPrompt } from '@/lib/storyAi/prompts';
import { saveBuilderState, saveWriteUp, storySeed } from '@/lib/storyAi/save';
import { writeUpSchema, type StoryWriteUp } from '@/lib/storyAi/schemas';
import { STAGES, openingMessage, parseStageMarker } from '@/lib/storyAi/stages';
import { UNTITLED_STORY } from '@/lib/stories';
import { cn } from '@/lib/utils';
import type { ChatTurn, Story } from '@/types';

export default function StoryBuilder() {
  const { id } = useParams();
  const query = useStoriesQuery();
  const stories = query.data;
  const story = stories?.find((s) => s.id === id);
  // The session starts from the story's saved transcript, so wait for data
  // loaded during this visit rather than the offline cache restored on load
  // (which can be a few turns behind). Offline, the cache is the best there is.
  const fresh =
    query.dataUpdatedAt >= performance.timeOrigin || query.isError || query.fetchStatus === 'paused';

  if (stories === undefined || !fresh) {
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
  // Keyed so a new story starts a fresh session.
  return <Builder key={story.id} story={story} />;
}

function Builder({ story }: { story: Story }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const competency = params.get('for') ?? story.details?.builder?.seed;
  const profile = useProfile().data;
  const { status } = useAiStatus();
  const targetRole =
    profile?.targetRoleFamily && profile.targetLevel
      ? roleTitle(profile.targetRoleFamily, profile.targetLevel)
      : 'Software Engineer';

  const saved = story.details?.builder;
  const title = story.title === UNTITLED_STORY ? '' : story.title;
  // ?stage=N (from the critic's "Fix with Builder") jumps to that stage with
  // its question, written locally, no AI call.
  const jump = Number(params.get('stage'));
  const jumpTo = jump >= 1 && jump <= STAGES.length ? jump : null;
  const [turns, setTurns] = useState<ChatTurn[]>(() => {
    const base: ChatTurn[] = saved?.turns?.length
      ? saved.turns
      : [{ role: 'assistant', content: openingMessage(title, competency ?? undefined) }];
    return jumpTo
      ? [...base, { role: 'assistant', content: `Let’s strengthen this part of the story. ${STAGES[jumpTo - 1].ask}` }]
      : base;
  });
  const [stage, setStage] = useState(jumpTo ?? saved?.stage ?? 1);
  const [viewStage, setViewStage] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [writing, setWriting] = useState(false);
  const [manual, setManual] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [turns, streaming]);

  // Save a jump once and drop ?stage, so a reload doesn't add it again.
  const jumped = useRef(false);
  useEffect(() => {
    if (!jumpTo || jumped.current) return;
    jumped.current = true;
    void saveBuilderState(story, { stage: jumpTo, turns, seed: competency ?? undefined });
    const next = new URLSearchParams(params);
    next.delete('stage');
    setParams(next, { replace: true });
  }, [jumpTo, story, turns, competency, params, setParams]);

  const seed = storySeed(story, competency ?? undefined);
  const busy = streaming !== null || writing;
  const answered = turns.filter((t) => t.role === 'user').length;
  const handOff = manual || (status && !status.enabled) || error?.handOff;

  const persist = (next: ChatTurn[], nextStage: number) =>
    void saveBuilderState(story, { stage: nextStage, turns: next, seed: competency ?? undefined });

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const withAnswer: ChatTurn[] = [...turns, { role: 'user', content: text }];
    setTurns(withAnswer);
    setInput('');
    setError(null);
    setStreaming('');
    try {
      let full = '';
      await aiStream('story-chat', { seed, targetRole, stage, turns: withAnswer }, (chunk) => {
        full += chunk;
        setStreaming(parseStageMarker(full).text);
      });
      const reply = parseStageMarker(full);
      const nextStage = reply.stage ?? stage;
      const next: ChatTurn[] = [...withAnswer, { role: 'assistant', content: reply.text }];
      setTurns(next);
      setStage(nextStage);
      setViewStage(null);
      persist(next, nextStage);
    } catch (e) {
      // Give the answer back so nothing typed is lost.
      setTurns(turns);
      setInput(text);
      setError(e instanceof AiError ? e : new AiError('server_error', 'Something went wrong. Try again.'));
    } finally {
      setStreaming(null);
    }
  };

  // Moving on is free: the next stage's opening question is written locally.
  const skipStage = () => {
    if (busy || stage >= STAGES.length) return;
    const nextStage = stage + 1;
    const next: ChatTurn[] = [...turns, { role: 'assistant', content: `Let’s move on. ${STAGES[nextStage - 1].ask}` }];
    setTurns(next);
    setStage(nextStage);
    setViewStage(null);
    persist(next, nextStage);
  };

  const finish = async (writeUp: StoryWriteUp) => {
    await saveWriteUp(story, writeUp);
    navigate(`/stories/${story.id}`);
  };

  const writeUp = async () => {
    if (busy || !answered) return;
    if (stage < 6 && !confirm('Some stages aren’t covered yet. Write up anyway? Missing parts will be listed as gaps.')) return;
    setWriting(true);
    setError(null);
    try {
      await finish(await aiPost<StoryWriteUp>('story-write', { seed, targetRole, turns }));
    } catch (e) {
      setError(e instanceof AiError ? e : new AiError('server_error', 'Something went wrong. Try again.'));
    } finally {
      setWriting(false);
    }
  };

  const shown = STAGES[(viewStage ?? stage) - 1];

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6" data-testid="story-builder">
      <Link to="/stories" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Story Bank
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">{title || 'New story'}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Story Builder{competency ? ` · for ${competency}` : ''}: answer the coach’s questions, then write it up.
      </p>

      {/* Stage progress */}
      <ol className="mb-5 grid grid-cols-8 gap-1" aria-label="Stages">
        {STAGES.map((st, i) => {
          const n = i + 1;
          return (
            <li key={st.title}>
              <button
                type="button"
                onClick={() => setViewStage(n)}
                title={st.title}
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors',
                  n < stage ? 'bg-emerald-500' : n === stage ? 'bg-primary' : 'bg-muted',
                  viewStage === n && 'ring-2 ring-ring ring-offset-1',
                )}
              />
              <span className={cn('mt-1 hidden text-[10px] leading-tight lg:block', n === stage ? 'font-medium' : 'text-muted-foreground')}>
                {st.title}
              </span>
            </li>
          );
        })}
      </ol>

      {handOff ? (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">Build this story in Claude</h2>
          <HandOffPanel<StoryWriteUp>
            reason={
              error?.message ??
              (status && !status.enabled
                ? 'The automatic coach isn’t available here, so run the interview in your own Claude account.'
                : 'Paste the prompt into a new Claude chat and answer its questions. When it’s done, it replies with your story as JSON.')
            }
            prompt={builderHandOffPrompt(seed, targetRole, writeUpSchema)}
            schema={writeUpSchema}
            importLabel="Import my story"
            onImport={finish}
          />
          {manual && status?.enabled && (
            <Button variant="link" size="sm" className="mt-2 h-auto p-0" onClick={() => setManual(false)}>
              Back to the in-app coach
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          {/* Chat */}
          <Card className="flex min-h-[420px] flex-col p-0">
            <div className="max-h-[60vh] flex-1 space-y-3 overflow-y-auto p-4" data-testid="builder-chat">
              {turns.map((t, i) => (
                <Bubble key={i} turn={t} />
              ))}
              {streaming !== null && (
                <Bubble turn={{ role: 'assistant', content: streaming || '…' }} />
              )}
              <div ref={bottom} />
            </div>
            <div className="space-y-2 border-t p-3">
              <Textarea
                aria-label="Your answer"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={3}
                placeholder="Type your answer… (⌘/Ctrl + Enter to send)"
                disabled={writing}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={send} disabled={!input.trim() || busy}>
                  {streaming !== null ? <Loader2 className="animate-spin" /> : <Send />}
                  Send
                </Button>
                <Button size="sm" variant="ghost" onClick={skipStage} disabled={busy || stage >= STAGES.length}>
                  Next stage <ChevronRight />
                </Button>
                <Button
                  size="sm"
                  variant={stage >= STAGES.length - 1 ? 'default' : 'outline'}
                  className="ml-auto"
                  onClick={writeUp}
                  disabled={busy || !answered}
                >
                  {writing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  Write up my story
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error.message}</p>}
              <p className="text-xs text-muted-foreground">
                {status?.fixture ? 'Test mode: sample replies, no AI call. ' : 'Your answers are sent to Claude. '}
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setManual(true)}>
                  Do it in Claude instead
                </Button>
              </p>
            </div>
          </Card>

          {/* Stage guide */}
          <Card className="h-fit space-y-3 p-4" data-testid="stage-guide">
            <div>
              <p className="text-xs text-muted-foreground">
                Stage {viewStage ?? stage} of {STAGES.length}
                {viewStage && viewStage !== stage ? ' (preview)' : ''}
              </p>
              <h2 className="text-sm font-semibold">{shown.title}</h2>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium">What a strong answer covers</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {shown.covers.map((c) => (
                  <li key={c} className="flex gap-1.5">
                    <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <details open className="text-xs">
              <summary className="cursor-pointer font-medium">Sample answer</summary>
              <blockquote className="mt-1.5 border-l-2 pl-2 italic text-muted-foreground">{shown.sample}</blockquote>
              <p className="mt-1 text-[10px] text-muted-foreground">From a made-up example story, to show the level of detail.</p>
            </details>
          </Card>
        </div>
      )}
    </div>
  );
}

function Bubble({ turn }: { turn: ChatTurn }) {
  const mine = turn.role === 'user';
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
        data-role={turn.role}
      >
        {turn.content}
      </div>
    </div>
  );
}
