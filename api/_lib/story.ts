// Request validation shared by the Story Builder endpoints.
import { HttpError } from './http.js';
import type { StorySeed, Turn } from '../../src/lib/storyAi/prompts.js';

const MAX_TURNS = 80;
const MAX_TURN_CHARS = 6000;
const MAX_TOTAL_CHARS = 80_000;

const text = (v: unknown, max = 4000) => String(v ?? '').slice(0, max);

export function readSeed(v: unknown): StorySeed {
  const s = (v ?? {}) as Record<string, unknown>;
  return {
    title: text(s.title, 200),
    situation: text(s.situation),
    task: text(s.task),
    action: text(s.action),
    result: text(s.result),
    metrics: text(s.metrics, 1000),
    gaps: Array.isArray(s.gaps) ? s.gaps.slice(0, 12).map((g) => text(g, 300)) : [],
    competency: s.competency ? text(s.competency, 100) : undefined,
  };
}

export function readTurns(v: unknown): Turn[] {
  if (!Array.isArray(v)) throw new HttpError(400, 'bad_request', 'turns must be a list.');
  if (v.length > MAX_TURNS) {
    throw new HttpError(400, 'bad_request', 'This conversation is too long. Write up the story, or start a new session.');
  }
  const turns = v.map((t) => ({
    role: (t as Turn)?.role === 'assistant' ? 'assistant' : 'user',
    content: text((t as Turn)?.content, MAX_TURN_CHARS),
  })) as Turn[];
  if (turns.reduce((n, t) => n + t.content.length, 0) > MAX_TOTAL_CHARS) {
    throw new HttpError(400, 'bad_request', 'This conversation is too long. Write up the story, or start a new session.');
  }
  return turns.filter((t) => t.content.trim());
}
