import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminNav } from '@/components/admin/AdminNav';
import { ADMIN_COMPANIES_KEY, fetchAdminCompanies } from '@/lib/adminCompanies';
import { AI_POLICY_COLOR, AI_POLICY_LABEL, ARCHETYPE_LABEL, ROLE_FAMILY_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** /admin/companies: shared companies, drafts and binned ones included. */
export default function AdminCompanies() {
  const { data, isLoading, error } = useQuery({ queryKey: ADMIN_COMPANIES_KEY, queryFn: fetchAdminCompanies });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list' | 'bin'>('list');
  const binned = (data ?? []).filter((c) => c.deletedAt !== null).length;

  const companies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (c) =>
        (tab === 'bin') === (c.deletedAt !== null) &&
        (!q || c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)),
    );
  }, [data, search, tab]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <AdminNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Company details and interview playbooks everyone sees on the Companies page.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/companies/new">
            <Plus className="size-4" /> New company
          </Link>
        </Button>
      </div>

      <div className="mb-3 flex gap-1 border-b" role="tablist">
        {([['list', 'Companies'], ['bin', `Bin (${binned})`]] as const).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or location…"
          className="pl-9" aria-label="Search companies" />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {tab === 'bin' ? 'The bin is empty.' : 'No companies match.'}
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => (
            <Card key={c.id} className="p-0">
              <Link to={`/admin/companies/${c.id}`} className="block space-y-1.5 rounded-xl p-3 transition-colors hover:bg-accent/50"
                data-testid="admin-company-row">
                <p className="text-sm font-medium">
                  {c.name}
                  {c.location && <span className="font-normal text-muted-foreground"> · {c.location}</span>}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-normal">{ARCHETYPE_LABEL[c.archetype] ?? c.archetype}</Badge>
                  <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', AI_POLICY_COLOR[c.aiPolicy])}>
                    {AI_POLICY_LABEL[c.aiPolicy] ?? c.aiPolicy}
                  </span>
                  {c.status === 'draft' && <Badge variant="outline" className="font-normal">Draft</Badge>}
                  {c.adminEdited && <Badge variant="secondary" className="font-normal">Edited in admin</Badge>}
                  <span className="text-xs text-muted-foreground">
                    Playbooks: {c.playbooks.length ? c.playbooks.map((p) => ROLE_FAMILY_LABEL[p.roleFamily]).join(', ') : 'none'}
                  </span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
