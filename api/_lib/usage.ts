// Per-user daily caps on AI calls, counted from ai_usage since 00:00 UTC.
// Each layer overrides the one before:
//   1. DEFAULT_LIMITS below
//   2. AI_DAILY_LIMITS env, e.g. "resume=3,chat=150,write=10", or "off"
//   3. app_settings 'ai_limits' (set in Admin → AI usage)
//   4. ai_limit_overrides for the user (also set there)
// Usage is always recorded, even with caps off.
import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './http.js';

export type Cap = 'resume' | 'read' | 'chat' | 'write' | 'critique' | 'jd';

const DEFAULT_LIMITS: Record<Cap, number> = {
  resume: 3,
  read: 5,
  chat: 150,
  write: 10,
  critique: 20,
  jd: 5,
};

/** The ai_usage endpoint that counts against each cap. */
const CAP_ENDPOINT: Record<Cap, string> = {
  resume: 'resume:drafts', // one resume run = one drafts step
  read: 'resume:read',
  chat: 'story:chat',
  write: 'story:write',
  critique: 'story:critique',
  jd: 'jd:gaps',
};

/** Remaining count reported when caps are off (JSON has no Infinity). */
export const UNLIMITED = 1_000_000;

export const CAPS = Object.keys(DEFAULT_LIMITS) as Cap[];

/** What each cap counts, for the admin page. */
export const CAP_ENDPOINTS = CAP_ENDPOINT;

/** Layers 1–2: built-in defaults and the AI_DAILY_LIMITS env variable. */
export function envLimits(): Record<Cap, number> {
  const out = { ...DEFAULT_LIMITS };
  if (process.env.AI_DAILY_LIMITS?.trim() === 'off') {
    for (const cap of Object.keys(out) as Cap[]) out[cap] = UNLIMITED;
    return out;
  }
  for (const pair of (process.env.AI_DAILY_LIMITS ?? '').split(',')) {
    const [key, value] = pair.split('=').map((s) => s.trim());
    if (key in out && Number.isFinite(Number(value))) out[key as Cap] = Number(value);
  }
  return out;
}

/** Admin-panel settings (layer 3). */
export interface LimitSettings {
  off?: boolean;
  limits?: Partial<Record<Cap, number>>;
}

const pick = (raw: unknown): Partial<Record<Cap, number>> => {
  const out: Partial<Record<Cap, number>> = {};
  if (raw && typeof raw === 'object') {
    for (const cap of CAPS) {
      const v = (raw as Record<string, unknown>)[cap];
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[cap] = v;
    }
  }
  return out;
};

/** Reads layers 3–4; empty before migration 0006 or if nothing is set. */
export async function storedLimits(
  admin: SupabaseClient,
  userId?: string,
): Promise<{ settings: LimitSettings; override: Partial<Record<Cap, number>> }> {
  const [settings, override] = await Promise.all([
    admin.from('app_settings').select('value').eq('key', 'ai_limits').maybeSingle(),
    userId
      ? admin.from('ai_limit_overrides').select('limits').eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const value = (settings.error ? null : settings.data?.value) as LimitSettings | null;
  return {
    settings: { off: value?.off === true, limits: pick(value?.limits) },
    override: override.error ? {} : pick(override.data?.limits),
  };
}

/** The limits that apply to one user right now. */
export async function limits(admin: SupabaseClient, userId: string): Promise<Record<Cap, number>> {
  const { settings, override } = await storedLimits(admin, userId);
  const out = { ...envLimits() };
  if (settings.off) for (const cap of CAPS) out[cap] = UNLIMITED;
  else Object.assign(out, settings.limits);
  return Object.assign(out, override);
}

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function remaining(admin: SupabaseClient, userId: string): Promise<Record<Cap, number>> {
  const { data, error } = await admin
    .from('ai_usage')
    .select('endpoint')
    .eq('user_id', userId)
    .gte('created_at', startOfTodayUtc());
  if (error) throw error;
  const used = new Map<string, number>();
  for (const row of data ?? []) used.set(row.endpoint, (used.get(row.endpoint) ?? 0) + 1);
  const max = await limits(admin, userId);
  const out = {} as Record<Cap, number>;
  for (const cap of Object.keys(max) as Cap[]) {
    out[cap] = Math.max(0, max[cap] - (used.get(CAP_ENDPOINT[cap]) ?? 0));
  }
  return out;
}

/**
 * Throws cap_reached when today's calls to `endpoint` (by default the one the
 * cap counts) have reached the cap's limit.
 */
export async function assertUnderCap(
  admin: SupabaseClient,
  userId: string,
  cap: Cap,
  endpoint = CAP_ENDPOINT[cap],
): Promise<void> {
  const { count, error } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', startOfTodayUtc());
  if (error) throw error;
  if ((count ?? 0) >= (await limits(admin, userId))[cap]) {
    throw new HttpError(429, 'cap_reached', 'You’ve reached today’s limit for this. Use “Do it in Claude” instead, or try again tomorrow.');
  }
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  /** The model that produced the reply (set by api/_lib/claude.ts). */
  model?: string;
}

export async function recordUsage(
  admin: SupabaseClient,
  userId: string,
  endpoint: string,
  usage: TokenUsage,
): Promise<void> {
  const input =
    usage.input_tokens + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  const { error } = await admin.from('ai_usage').insert({
    user_id: userId,
    endpoint,
    tokens_in: input,
    tokens_out: usage.output_tokens,
    model: usage.model ?? null,
  });
  if (error?.message.includes('model')) {
    // Before migration 0006 there is no model column.
    const retry = await admin.from('ai_usage').insert({ user_id: userId, endpoint, tokens_in: input, tokens_out: usage.output_tokens });
    if (retry.error) console.error('ai_usage insert failed', retry.error);
  } else if (error) console.error('ai_usage insert failed', error);
}
