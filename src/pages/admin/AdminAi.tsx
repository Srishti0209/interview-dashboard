import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminNav } from '@/components/admin/AdminNav';
import { adminGet, adminPost } from '@/lib/adminApi';
import type { AiUsageReport, UsageTotals } from '../../../api/admin/ai';

type Cap = AiUsageReport['limits']['caps'][number];
type Limits = Partial<Record<Cap, number>>;

const CAP_LABEL: Record<string, string> = {
  resume: 'Stories from resume',
  read: 'Resume reading (Fix with Claude)',
  chat: 'Story Builder messages',
  write: 'Story write-ups',
  critique: 'Story critiques',
  jd: 'Job analyses',
};

const FEATURE_LABEL: Record<string, string> = {
  'resume:parse': 'Read resume',
  'resume:drafts': 'Stories from resume',
  'resume:questions': 'Questions from resume',
  'resume:read': 'Fix with Claude (resume)',
  'story:chat': 'Story Builder chat',
  'story:write': 'Story write-up',
  'story:critique': 'Story critique',
  'jd:gaps': 'Job analysis',
};

const usd = (n: number) => (n < 0.01 && n > 0 ? '<$0.01' : `$${n.toFixed(2)}`);
const num = (n: number) => n.toLocaleString();

/** /admin/ai: AI calls, estimated cost and daily limits. */
export default function AdminAi() {
  const [days, setDays] = useState(7);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ai', days],
    queryFn: () => adminGet<AiUsageReport>(`ai?days=${days}`),
    staleTime: 0,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-ai'] });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <AdminNav />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">AI usage</h1>
        <p className="text-sm text-muted-foreground">
          Calls to Claude and their estimated cost in US dollars (list prices; slightly high when replies reuse cached
          context). Days start at 00:00 UTC, like the daily limits.
        </p>
      </div>

      <div className="flex gap-1">
        {[[1, 'Today'], [7, '7 days'], [30, '30 days']].map(([d, label]) => (
          <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d as number)}>
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="ai-totals">
            <Stat label="Calls" value={num(data.total.calls)} />
            <Stat label="Estimated cost" value={usd(data.total.cost)} />
            <Stat label="Input tokens" value={num(data.total.tokensIn)} />
            <Stat label="Output tokens" value={num(data.total.tokensOut)} />
          </div>

          <UsageTable
            title="By person"
            testId="ai-by-user"
            rows={data.byUser.map((u) => ({ key: u.userId, label: u.email, totals: u }))}
          />
          <UsageTable
            title="By feature"
            testId="ai-by-feature"
            rows={data.byFeature.map((f) => ({ key: f.endpoint, label: FEATURE_LABEL[f.endpoint] ?? f.endpoint, totals: f }))}
          />
          {days > 1 && (
            <UsageTable
              title="By day"
              testId="ai-by-day"
              rows={data.byDay.map((d) => ({ key: d.day, label: d.day, totals: d }))}
            />
          )}

          <GlobalLimits key={JSON.stringify(data.limits.settings)} report={data} onSaved={refresh} />
          <Overrides key={JSON.stringify(data.limits.overrides)} report={data} onSaved={refresh} />
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function UsageTable({
  title,
  testId,
  rows,
}: {
  title: string;
  testId: string;
  rows: { key: string; label: string; totals: UsageTotals }[];
}) {
  return (
    <Card className="p-4" data-testid={testId}>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No AI calls in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2 font-medium" />
                <th className="px-2 py-1 text-right font-medium">Calls</th>
                <th className="px-2 py-1 text-right font-medium">Tokens in</th>
                <th className="px-2 py-1 text-right font-medium">Tokens out</th>
                <th className="py-1 pl-2 text-right font-medium">Est. cost</th>
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="max-w-64 truncate py-1.5 pr-2">{r.label}</td>
                  <td className="px-2 py-1.5 text-right">{num(r.totals.calls)}</td>
                  <td className="px-2 py-1.5 text-right">{num(r.totals.tokensIn)}</td>
                  <td className="px-2 py-1.5 text-right">{num(r.totals.tokensOut)}</td>
                  <td className="py-1.5 pl-2 text-right">{usd(r.totals.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Six number inputs, one per daily limit. Empty = use the fallback shown. */
function LimitInputs({
  idPrefix,
  caps,
  values,
  fallback,
  onChange,
}: {
  idPrefix: string;
  caps: Cap[];
  values: Record<string, string>;
  fallback: (cap: Cap) => string;
  onChange: (cap: Cap, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {caps.map((cap) => (
        <div key={cap} className="space-y-1">
          <Label htmlFor={`${idPrefix}-${cap}`} className="text-xs">{CAP_LABEL[cap] ?? cap}</Label>
          <Input
            id={`${idPrefix}-${cap}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={values[cap] ?? ''}
            placeholder={fallback(cap)}
            onChange={(e) => onChange(cap, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

const toInputs = (l: Limits) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, String(v)]));

function GlobalLimits({ report, onSaved }: { report: AiUsageReport; onSaved: () => void }) {
  const { caps, env, settings } = report.limits;
  const [off, setOff] = useState(settings.off === true);
  const [values, setValues] = useState<Record<string, string>>(toInputs(settings.limits ?? {}));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await adminPost('ai', { settings: { off, limits: values } });
      setMsg('Saved. Applies to the next AI call.');
      onSaved();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-5" data-testid="ai-limits">
      <div>
        <h2 className="text-sm font-semibold">Daily limits for everyone</h2>
        <p className="text-xs text-muted-foreground">
          Per person, per day. Leave a box empty to use the default shown. When someone reaches a limit, they're offered
          “Do it in Claude” instead.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div>
          <Label htmlFor="ai-off">No limits</Label>
          <p className="text-xs text-muted-foreground">Everyone can use AI features as much as they like. Usage is still recorded.</p>
        </div>
        <Switch id="ai-off" checked={off} onCheckedChange={setOff} />
      </div>
      {!off && (
        <LimitInputs idPrefix="global" caps={caps} values={values} fallback={(c) => String(env[c])}
          onChange={(c, v) => setValues((x) => ({ ...x, [c]: v }))} />
      )}
      <div className="flex items-center gap-2">
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />} Save limits
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </Card>
  );
}

function Overrides({ report, onSaved }: { report: AiUsageReport; onSaved: () => void }) {
  const { caps, overrides } = report.limits;
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = (userId: string) => {
    setEditing(userId);
    setValues(toInputs(overrides.find((o) => o.userId === userId)?.limits ?? {}));
    setError('');
  };
  const save = async (userId: string, limits: Record<string, string> | null) => {
    setBusy(true);
    setError('');
    try {
      await adminPost('ai', { userId, limits });
      setEditing(null);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5" data-testid="ai-overrides">
      <div>
        <h2 className="text-sm font-semibold">Limits for one person</h2>
        <p className="text-xs text-muted-foreground">Overrides the limits above for someone who needs more (or less).</p>
      </div>
      {overrides.length > 0 && (
        <ul className="divide-y text-sm">
          {overrides.map((o) => (
            <li key={o.userId} className="flex flex-wrap items-center gap-2 py-2" data-testid="ai-override">
              <span className="min-w-0 flex-1 truncate">
                {o.email}
                <span className="text-xs text-muted-foreground">
                  {' '}· {Object.entries(o.limits).map(([c, v]) => `${CAP_LABEL[c] ?? c}: ${v}`).join(', ')}
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => open(o.userId)}>Edit</Button>
              <Button size="sm" variant="ghost" className="text-destructive" disabled={busy}
                onClick={() => void save(o.userId, null)}>
                <X /> Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          aria-label="Person"
          value={editing ?? ''}
          onChange={(e) => (e.target.value ? open(e.target.value) : setEditing(null))}
        >
          <option value="">Choose a person…</option>
          {report.users.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
        {!editing && <span className="text-xs text-muted-foreground"><SlidersHorizontal className="inline size-3.5" /> to set their limits</span>}
      </div>
      {editing && (
        <div className="space-y-3 rounded-md border p-3">
          <LimitInputs idPrefix="override" caps={caps} values={values} fallback={() => 'as above'}
            onChange={(c, v) => setValues((x) => ({ ...x, [c]: v }))} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void save(editing, values)} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Save />} Save for this person
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
