// GET  /api/admin/ai?days=1|7|30 → AI calls and estimated cost by person,
//      feature and day, plus the daily limits in force.
// POST /api/admin/ai { settings: { off, limits } }      → app-wide limits
//      /api/admin/ai { userId, limits: {...} | null }  → one person's override
import { requireAdmin, selectAll } from '../_lib/admin.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';
import { estimateCost } from '../_lib/pricing.js';
import { CAPS, CAP_ENDPOINTS, envLimits, storedLimits, type Cap, type LimitSettings } from '../_lib/usage.js';

interface UsageRow {
  user_id: string;
  endpoint: string;
  tokens_in: number;
  tokens_out: number;
  model: string | null;
  created_at: string;
}

export interface UsageTotals {
  calls: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export interface AiUsageReport {
  days: number;
  since: string;
  total: UsageTotals;
  byUser: (UsageTotals & { userId: string; email: string })[];
  byFeature: (UsageTotals & { endpoint: string })[];
  byDay: (UsageTotals & { day: string })[];
  limits: {
    caps: Cap[];
    capEndpoints: Record<Cap, string>;
    env: Record<Cap, number>;
    settings: LimitSettings;
    overrides: { userId: string; email: string; limits: Partial<Record<Cap, number>> }[];
  };
  users: { id: string; email: string }[];
}

const empty = (): UsageTotals => ({ calls: 0, tokensIn: 0, tokensOut: 0, cost: 0 });
const add = (t: UsageTotals, r: UsageRow, cost: number) => {
  t.calls += 1;
  t.tokensIn += r.tokens_in;
  t.tokensOut += r.tokens_out;
  t.cost += cost;
};

export const GET = handle(async (req) => {
  const { admin } = await requireAdmin(req);
  const days = [1, 7, 30].includes(Number(new URL(req.url).searchParams.get('days')))
    ? Number(new URL(req.url).searchParams.get('days'))
    : 7;
  // "Today" starts at 00:00 UTC, matching how the daily limits count.
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await selectAll<UsageRow>(admin, 'ai_usage',
    'user_id, endpoint, tokens_in, tokens_out, model, created_at', { since: ['created_at', since.toISOString()] });

  const emails = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) emails.set(u.id, u.email ?? '');
    if (data.users.length < 1000) break;
  }

  const total = empty();
  const byUser = new Map<string, UsageTotals>();
  const byFeature = new Map<string, UsageTotals>();
  const byDay = new Map<string, UsageTotals>();
  for (const r of rows) {
    const cost = estimateCost(r.endpoint, r.model, r.tokens_in, r.tokens_out);
    add(total, r, cost);
    for (const [map, key] of [[byUser, r.user_id], [byFeature, r.endpoint], [byDay, r.created_at.slice(0, 10)]] as const) {
      if (!map.has(key)) map.set(key, empty());
      add(map.get(key)!, r, cost);
    }
  }

  const { settings } = await storedLimits(admin);
  const { data: overrideRows } = await admin.from('ai_limit_overrides').select('user_id, limits');

  const report: AiUsageReport = {
    days,
    since: since.toISOString(),
    total,
    byUser: [...byUser].map(([userId, t]) => ({ userId, email: emails.get(userId) ?? '(deleted user)', ...t }))
      .sort((a, b) => b.cost - a.cost),
    byFeature: [...byFeature].map(([endpoint, t]) => ({ endpoint, ...t })).sort((a, b) => b.cost - a.cost),
    byDay: [...byDay].map(([day, t]) => ({ day, ...t })).sort((a, b) => a.day.localeCompare(b.day)),
    limits: {
      caps: CAPS,
      capEndpoints: CAP_ENDPOINTS,
      env: envLimits(),
      settings,
      overrides: (overrideRows ?? []).map((o) => ({
        userId: o.user_id,
        email: emails.get(o.user_id) ?? '(deleted user)',
        limits: o.limits ?? {},
      })),
    },
    users: [...emails].map(([id, email]) => ({ id, email })).sort((a, b) => a.email.localeCompare(b.email)),
  };
  return json(report);
});

const cleanLimits = (raw: unknown): Partial<Record<Cap, number>> => {
  const out: Partial<Record<Cap, number>> = {};
  if (raw && typeof raw === 'object') {
    for (const cap of CAPS) {
      const v = (raw as Record<string, unknown>)[cap];
      if (v === undefined || v === null || v === '') continue;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 100_000) {
        throw new HttpError(400, 'bad_request', `The ${cap} limit must be a whole number from 0 to 100000.`);
      }
      out[cap] = n;
    }
  }
  return out;
};

export const POST = handle(async (req) => {
  const { admin, userId: me } = await requireAdmin(req);
  const body = await readJson<{ settings?: { off?: unknown; limits?: unknown }; userId?: unknown; limits?: unknown }>(req);

  if (body.settings) {
    const value: LimitSettings = { off: body.settings.off === true, limits: cleanLimits(body.settings.limits) };
    const { error } = await admin
      .from('app_settings')
      .upsert({ key: 'ai_limits', value, updated_at: new Date().toISOString(), updated_by: me });
    if (error) throw error;
    return json({ ok: true });
  }

  if (typeof body.userId === 'string') {
    const limits = body.limits === null ? null : cleanLimits(body.limits);
    const { error } = limits && Object.keys(limits).length
      ? await admin.from('ai_limit_overrides').upsert({ user_id: body.userId, limits, updated_at: new Date().toISOString() })
      : await admin.from('ai_limit_overrides').delete().eq('user_id', body.userId);
    if (error) throw error;
    return json({ ok: true });
  }

  throw new HttpError(400, 'bad_request', 'Send { settings } or { userId, limits }.');
});
