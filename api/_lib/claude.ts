// Claude API access for the /api functions. The key is server-only
// (CLAUDE_API_KEY). With AI_FIXTURE=1 (the dev default, see vite.config.ts)
// every call returns canned data from fixtures.ts and costs nothing.
import Anthropic from '@anthropic-ai/sdk';
import { HttpError } from './http.js';
import { FIXTURES, FIXTURE_CHAT_REPLY } from './fixtures.js';
import type { TokenUsage } from './usage.js';
import type { Schema } from '../../src/lib/storyAi/schemas.js';

export type Task = 'parse' | 'read' | 'drafts' | 'questions' | 'chat' | 'write' | 'critique' | 'jd';

const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';

/** Model per task; each can be overridden by env (e.g. Opus for paid plans). */
const MODEL: Record<Task, { env: string; fallback: string }> = {
  parse: { env: 'AI_MODEL_PARSE', fallback: HAIKU },
  read: { env: 'AI_MODEL_PARSE', fallback: HAIKU },
  drafts: { env: 'AI_MODEL_DRAFTS', fallback: SONNET },
  questions: { env: 'AI_MODEL_DRAFTS', fallback: SONNET },
  chat: { env: 'AI_MODEL_CHAT', fallback: SONNET },
  write: { env: 'AI_MODEL_WRITE', fallback: SONNET },
  critique: { env: 'AI_MODEL_CRITIQUE', fallback: SONNET },
  jd: { env: 'AI_MODEL_JD', fallback: SONNET },
};

const EFFORT: Record<Task, 'low' | 'medium' | 'high'> = {
  parse: 'low',
  read: 'low',
  drafts: 'medium',
  questions: 'medium',
  chat: 'low',
  write: 'high',
  critique: 'medium',
  jd: 'medium',
};

const ZERO_USAGE: TokenUsage = { input_tokens: 0, output_tokens: 0 };

export const fixtureMode = () => process.env.AI_FIXTURE === '1';
const apiKey = () => process.env.CLAUDE_API_KEY?.trim();
export const aiEnabled = () => fixtureMode() || Boolean(apiKey());

const modelFor = (task: Task) => process.env[MODEL[task].env]?.trim() || MODEL[task].fallback;

let client: Anthropic | undefined;
function getClient(): Anthropic {
  const key = apiKey();
  if (!key) {
    throw new HttpError(503, 'no_key', 'The AI service isn’t set up here. Use “Do it in Claude” instead.');
  }
  client ??= new Anthropic({ apiKey: key });
  return client;
}

export interface StructuredRequest {
  /** Stable instructions (cached). */
  system: string;
  /** Large per-user context such as a resume (cached, so later steps reuse it). */
  context?: string;
  /** The specific ask for this call. */
  user: string;
  /** PDFs (base64) for Claude to read, e.g. the original resume. */
  pdfs?: string[];
  schema: Schema;
  maxTokens?: number;
}

/** One call whose reply is JSON matching `schema` (structured outputs). */
export async function structured(
  task: Task,
  req: StructuredRequest,
): Promise<{ value: unknown; usage: TokenUsage }> {
  if (fixtureMode()) return { value: structuredClone(FIXTURES[task]), usage: ZERO_USAGE };

  const model = modelFor(task);
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const data of req.pdfs ?? []) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } });
  }
  if (req.context) {
    content.push({ type: 'text', text: req.context, cache_control: { type: 'ephemeral' } });
  }
  content.push({ type: 'text', text: req.user });

  const response = await getClient().beta.messages.create({
    model,
    max_tokens: req.maxTokens ?? 16000,
    system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }],
    output_config: { effort: EFFORT[task], format: { type: 'json_schema', schema: req.schema } },
    // Haiku has no server-side fallback; Sonnet/Opus re-run on refusal.
    ...(model.startsWith('claude-haiku')
      ? {}
      : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
  });

  if (response.stop_reason === 'refusal') {
    throw new HttpError(422, 'refused', 'Claude declined this request. Try rephrasing, or use “Do it in Claude”.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new HttpError(502, 'bad_output', 'The reply was too long and got cut off. Try again.');
  }
  const text = response.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('');
  try {
    return { value: JSON.parse(text), usage: { ...response.usage, model: response.model } };
  } catch {
    throw new HttpError(502, 'bad_output', 'Claude returned an unexpected reply. Try again.');
  }
}

export interface ChatRequest {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}

/**
 * Streams a chat reply as plain text. `onDone` runs with the token usage
 * before the stream closes, so the usage is recorded even on serverless
 * hosts that stop work once the response ends.
 */
export function streamChat(
  task: Task,
  req: ChatRequest,
  opts: { fixtureReply?: string; onDone?: (usage: TokenUsage) => Promise<void> } = {},
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  if (fixtureMode()) {
    const words = (opts.fixtureReply ?? FIXTURE_CHAT_REPLY).split(/(?<= )/);
    return new ReadableStream({
      async start(controller) {
        for (const w of words) {
          controller.enqueue(encoder.encode(w));
          await new Promise((r) => setTimeout(r, 5));
        }
        await opts.onDone?.(ZERO_USAGE);
        controller.close();
      },
    });
  }

  const stream = getClient().messages.stream({
    model: modelFor(task),
    max_tokens: req.maxTokens ?? 2000,
    system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
    // Cache the conversation so far: each turn re-sends it.
    cache_control: { type: 'ephemeral' },
    messages: req.messages,
    output_config: { effort: EFFORT[task] },
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        await opts.onDone?.({ ...final.usage, model: final.model });
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() {
      stream.abort();
    },
  });
}
