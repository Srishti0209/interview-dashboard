// Browser side of the /api/ai functions: attaches the session token and turns
// error replies into AiError, whose `handOff` flag tells the UI to offer the
// "Do it in Claude" path instead.
import { supabase } from '@/lib/supabase';

export type AiCap = 'resume' | 'read' | 'chat' | 'write' | 'critique' | 'jd';

export interface AiStatus {
  enabled: boolean;
  fixture: boolean;
  remaining: Record<AiCap, number>;
}

export class AiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
  /** True when retrying won't help today and the hand-off should be offered. */
  get handOff(): boolean {
    return ['no_key', 'cap_reached', 'refused', 'network'].includes(this.code);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AiError('unauthorized', 'Please sign in again.');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function send(path: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`/api/ai/${path}`, { ...init, headers: await authHeaders() });
  } catch {
    throw new AiError('network', 'You seem to be offline. You can still use “Do it in Claude”.');
  }
  if (res.ok) return res;
  let body: { error?: string; message?: string } = {};
  try {
    body = await res.json();
  } catch {
    // Not our JSON (e.g. the SPA fallback when /api isn't deployed).
  }
  if (res.status === 404 && !body.error) {
    throw new AiError('no_key', 'The AI service isn’t available here. Use “Do it in Claude” instead.');
  }
  throw new AiError(body.error ?? 'server_error', body.message ?? 'Something went wrong. Try again.');
}

export async function fetchAiStatus(): Promise<AiStatus> {
  return (await send('status', { method: 'GET' })).json();
}

export async function aiPost<T>(path: string, body: unknown): Promise<T> {
  return (await send(path, { method: 'POST', body: JSON.stringify(body) })).json();
}

/** POSTs and calls `onText` with each chunk of a streamed text reply. */
export async function aiStream(
  path: string,
  body: unknown,
  onText: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await send(path, { method: 'POST', body: JSON.stringify(body), signal });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    full += text;
    onText(text);
  }
  return full;
}
