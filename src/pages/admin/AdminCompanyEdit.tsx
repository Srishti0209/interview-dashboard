import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArchiveRestore, ArrowLeft, Loader2, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Markdown } from '@/components/Markdown';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useSession } from '@/hooks/useSession';
import { fetchVersions, type RawVersion } from '@/lib/admin';
import {
  companyFromBin,
  companyFromRow,
  companyToBin,
  deleteCompanyForever,
  fetchAdminCompany,
  playbookFromRow,
  saveCompany,
  savePlaybook,
  type AdminCompany,
  type AdminPlaybook,
  type CompanyInput,
  type CompanyRow,
  type PlaybookRow,
} from '@/lib/adminCompanies';
import {
  AI_POLICY_LABEL,
  ARCHETYPE_LABEL,
  ROLE_FAMILIES,
  ROLE_FAMILY_LABEL,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { AiPolicy, Archetype, RoleFamily } from '@/types';

const EMPTY: CompanyInput = {
  name: '',
  location: '',
  archetype: 'product_led',
  aiPolicy: 'mixed',
  links: [],
  status: 'draft',
};

/** /admin/companies/new and /admin/companies/:id */
export default function AdminCompanyEdit() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-company', id],
    queryFn: () => fetchAdminCompany(id!),
    enabled: !isNew,
    staleTime: 0,
  });
  // "Saved" notes live here: a save brings fresh data, which re-creates the
  // editors below. Keys: 'details' or a role family, per company.
  const [saved, setSaved] = useState<string | null>(null);

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isNew && (error || !data)) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm">
        <BackLink />
        <p className="mt-4 text-destructive">{error ? (error as Error).message : 'Company not found.'}</p>
      </div>
    );
  }
  const company = isNew ? null : data!;
  const savedKey = (part: string) => (company ? `${company.id}:${part}` : null);
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <BackLink />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{company ? company.name : 'New company'}</h1>
        {company && <p className="font-mono text-xs text-muted-foreground">{company.id}</p>}
      </div>
      <DetailsEditor
        key={company ? JSON.stringify([company.id, company.name, company.location, company.archetype, company.aiPolicy, company.links, company.status, company.deletedAt]) : 'new'}
        company={company}
        saved={!!company && saved === savedKey('details')}
        onSaved={(cid) => setSaved(`${cid}:details`)}
        onChange={() => setSaved(null)}
      />
      {company ? (
        <Playbooks company={company} saved={saved} onSaved={(role) => setSaved(savedKey(role))} onChange={() => setSaved(null)} />
      ) : (
        <Card className="p-5 text-sm text-muted-foreground">Create the company first, then add its interview playbooks.</Card>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Companies
    </Link>
  );
}

function DetailsEditor({
  company,
  saved,
  onSaved,
  onChange,
}: {
  company: AdminCompany | null;
  saved: boolean;
  onSaved: (companyId: string) => void;
  onChange: () => void;
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState<CompanyInput>(company ?? EMPTY);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const set = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    onChange();
  };
  const setLink = (i: number, part: 'label' | 'url', value: string) =>
    set('links', form.links.map((l, j) => (j === i ? { ...l, [part]: value } : l)));

  const run = async (action: string, fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(action);
    setError('');
    try {
      await fn();
      after?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    form.name.trim()
      ? run('save', async () => {
          const id = await saveCompany(form, company?.id);
          onSaved(id);
          if (!company) navigate(`/admin/companies/${id}`, { replace: true });
        })
      : setError('Add a name.');

  const published = form.status === 'approved';

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold">Company details</h2>
      {company?.deletedAt && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="in-bin">
          <span className="flex-1">In the bin: hidden from users. Their application tracking is kept.</span>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void run('restore', () => companyFromBin(company.id))}>
            {busy === 'restore' ? <Loader2 className="animate-spin" /> : <ArchiveRestore />} Restore
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null}
            onClick={() =>
              window.confirm(`Delete ${company.name} forever?\n\nThis also deletes its playbooks and every user's application tracking for it. It can't be undone.`) &&
              void run('forever', () => deleteCompanyForever(company.id), () => navigate('/admin/companies', { replace: true }))
            }>
            {busy === 'forever' ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete forever
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-location">Location</Label>
          <Input id="c-location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. London / Remote" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.archetype} onValueChange={(v) => set('archetype', v as Archetype)}>
            <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ARCHETYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>AI policy in interviews</Label>
          <Select value={form.aiPolicy} onValueChange={(v) => set('aiPolicy', v as AiPolicy)}>
            <SelectTrigger aria-label="AI policy"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(AI_POLICY_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Links</legend>
        {form.links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="Label, e.g. Careers" aria-label={`Link ${i + 1} label`} className="w-40" />
            <Input value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://…" aria-label={`Link ${i + 1} URL`} />
            <Button variant="ghost" size="icon" aria-label={`Remove link ${i + 1}`} onClick={() => set('links', form.links.filter((_, j) => j !== i))}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set('links', [...form.links, { label: '', url: '' }])}>
          <Plus /> Add link
        </Button>
      </fieldset>

      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div>
          <Label htmlFor="c-published">Published</Label>
          <p className="text-xs text-muted-foreground">
            {published ? 'Shown on everyone’s Companies page.' : 'Draft: only admins can see it.'}
          </p>
        </div>
        <Switch id="c-published" checked={published} onCheckedChange={(on) => set('status', on ? 'approved' : 'draft')} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void save()} disabled={busy !== null}>
          {busy === 'save' ? <Loader2 className="animate-spin" /> : <Save />}
          {company ? 'Save details' : 'Create company'}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved{published ? ' and live for users' : ' as a draft'}.</span>}
        {company && !company.deletedAt && (
          <Button variant="ghost" className="ml-auto text-destructive" disabled={busy !== null}
            onClick={() =>
              window.confirm(`Move ${company.name} to the bin?\n\nIt disappears for users, but their application tracking is kept. You can restore it from the Bin tab.`) &&
              void run('bin', () => companyToBin(company.id), () => navigate('/admin/companies', { replace: true }))
            }>
            {busy === 'bin' ? <Loader2 className="animate-spin" /> : <Trash2 />} Move to bin
          </Button>
        )}
      </div>

      {company && (
        <VersionList<CompanyRow>
          title="Details history"
          entity="company"
          entityId={company.id}
          describe={(c) => `${c.name} · ${c.location || 'no location'} · ${AI_POLICY_LABEL[c.ai_policy] ?? c.ai_policy}${c.review_status !== 'approved' ? ' · draft' : ''}${c.deleted_at ? ' · in the bin' : ''}`}
          preview={(c) => (
            <ul className="text-sm">
              <li>Type: {ARCHETYPE_LABEL[c.archetype] ?? c.archetype}</li>
              <li>Links: {(c.links ?? []).map((l) => l.label).join(', ') || 'none'}</li>
            </ul>
          )}
          onRestore={async (c) => {
            const old = companyFromRow(c);
            const id = await saveCompany(old, company.id);
            onSaved(id);
          }}
        />
      )}
    </Card>
  );
}

function Playbooks({
  company,
  saved,
  onSaved,
  onChange,
}: {
  company: AdminCompany;
  saved: string | null;
  onSaved: (role: RoleFamily) => void;
  onChange: () => void;
}) {
  const [role, setRole] = useState<RoleFamily>('frontend');
  const current: AdminPlaybook =
    company.playbooks.find((p) => p.roleFamily === role) ??
    { roleFamily: role, loopStructure: '', notes: '', status: 'draft' };
  const exists = company.playbooks.some((p) => p.roleFamily === role);

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">Interview playbooks</h2>
        <p className="text-xs text-muted-foreground">
          One per job title. Users see the playbook for their target role, or the Frontend one if theirs is missing or a draft.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {ROLE_FAMILIES.map((r) => {
          const pb = company.playbooks.find((p) => p.roleFamily === r);
          return (
            <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                role === r ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}>
              {ROLE_FAMILY_LABEL[r]}
              {!pb ? ' (none)' : pb.status === 'draft' ? ' (draft)' : ''}
            </button>
          );
        })}
      </div>
      <PlaybookEditor
        key={JSON.stringify([role, current])}
        companyId={company.id}
        playbook={current}
        exists={exists}
        saved={saved === `${company.id}:${role}`}
        onSaved={() => onSaved(role)}
        onChange={onChange}
      />
    </Card>
  );
}

function PlaybookEditor({
  companyId,
  playbook,
  exists,
  saved,
  onSaved,
  onChange,
}: {
  companyId: string;
  playbook: AdminPlaybook;
  exists: boolean;
  saved: boolean;
  onSaved: () => void;
  onChange: () => void;
}) {
  const [form, setForm] = useState(playbook);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof AdminPlaybook>(key: K, value: AdminPlaybook[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    onChange();
  };
  const save = async (next = form) => {
    setBusy(true);
    setError('');
    try {
      await savePlaybook(companyId, next);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const published = form.status === 'approved';
  const label = ROLE_FAMILY_LABEL[playbook.roleFamily];

  return (
    <div className="space-y-4">
      {!exists && <p className="text-sm text-muted-foreground">No {label} playbook yet. Write one below and save.</p>}
      <div className="space-y-1.5">
        <Label>Interview loop structure</Label>
        <MarkdownEditor value={form.loopStructure} onChange={(v) => set('loopStructure', v)} minRows={8}
          placeholder="The rounds, in order, and what each one tests (Markdown)…" />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <MarkdownEditor value={form.notes} onChange={(v) => set('notes', v)} minRows={6}
          placeholder="Tips, values, what interviewers look for (Markdown)…" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div>
          <Label htmlFor="pb-published">Published</Label>
          <p className="text-xs text-muted-foreground">
            {published ? `Shown to users preparing for ${label}.` : 'Draft: only admins can see it.'}
          </p>
        </div>
        <Switch id="pb-published" checked={published} onCheckedChange={(on) => set('status', on ? 'approved' : 'draft')} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />} Save {label} playbook
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved{published ? ' and live for users' : ' as a draft'}.</span>}
      </div>
      {exists && (
        <VersionList<PlaybookRow>
          title={`${label} playbook history`}
          entity="playbook"
          entityId={`${companyId}:${playbook.roleFamily}`}
          describe={(p) => (p.review_status !== 'approved' ? 'was a draft' : 'published')}
          preview={(p) => (
            <>
              <Markdown>{p.loop_structure || '_No loop structure._'}</Markdown>
              <hr />
              <Markdown>{p.notes || '_No notes._'}</Markdown>
            </>
          )}
          onRestore={async (p) => {
            await savePlaybook(companyId, playbookFromRow(p));
            onSaved();
          }}
        />
      )}
    </div>
  );
}

/** Earlier versions of a company or playbook, each viewable and restorable. */
function VersionList<T>({
  title,
  entity,
  entityId,
  describe,
  preview,
  onRestore,
}: {
  title: string;
  entity: 'company' | 'playbook';
  entityId: string;
  describe: (snapshot: T) => string;
  preview: (snapshot: T) => React.ReactNode;
  onRestore: (snapshot: T) => Promise<void>;
}) {
  const me = useSession()?.user.id;
  const { data: versions, isLoading } = useQuery({
    queryKey: ['admin-company-versions', entity, entityId],
    queryFn: () => fetchVersions<T>(entity, entityId),
    staleTime: 0,
  });
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');

  const restore = async (v: RawVersion<T>) => {
    if (!window.confirm('Restore this version? The current version is kept in the history.')) return;
    setBusy(v.id);
    setError('');
    try {
      await onRestore(v.snapshot);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <details className="rounded-md border p-3" data-testid={`history-${entity}`}>
      <summary className="cursor-pointer text-sm font-medium">
        {title} {versions && `(${versions.length})`}
      </summary>
      {isLoading ? (
        <Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" />
      ) : !versions?.length ? (
        <p className="mt-2 text-sm text-muted-foreground">No earlier versions yet.</p>
      ) : (
        <ul className="mt-2 divide-y">
          {versions.map((v) => (
            <li key={v.id} className="space-y-2 py-2" data-testid="version">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex-1">
                  {new Date(v.created_at).toLocaleString()}
                  <span className="text-muted-foreground">
                    {' '}· {v.changed_by === me ? 'you' : 'another admin'} · {describe(v.snapshot)}
                  </span>
                </span>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen(open === v.id ? null : v.id)}>
                  {open === v.id ? 'Hide' : 'View'}
                </Button>
                <Button size="sm" variant="outline" className="h-7" disabled={busy !== null} onClick={() => void restore(v)}>
                  {busy === v.id ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restore
                </Button>
              </div>
              {open === v.id && <div className="rounded-md border p-3">{preview(v.snapshot)}</div>}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </details>
  );
}
