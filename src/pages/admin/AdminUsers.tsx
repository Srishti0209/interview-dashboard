import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminNav } from '@/components/admin/AdminNav';
import { useSession } from '@/hooks/useSession';
import { adminGet, adminPost } from '@/lib/adminApi';
import { roleTitle } from '@/lib/constants';
import type { RoleFamily, RoleLevel } from '@/types';
import type { AdminUser } from '../../../api/admin/users';

export const ADMIN_USERS_KEY = ['admin-users'] as const;

const SORTS = {
  active: ['Last signed in', (a: AdminUser, b: AdminUser) => (b.lastSignInAt ?? '').localeCompare(a.lastSignInAt ?? '')],
  joined: ['Newest first', (a: AdminUser, b: AdminUser) => b.createdAt.localeCompare(a.createdAt)],
  practised: ['Most practised', (a: AdminUser, b: AdminUser) => b.practised - a.practised],
  name: ['Name', (a: AdminUser, b: AdminUser) => (a.name ?? a.email).localeCompare(b.name ?? b.email)],
} as const;

const ago = (iso: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : 'never');

/** /admin/users: who has joined and how much they practise. */
export default function AdminUsers() {
  const me = useSession()?.user.id;
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ADMIN_USERS_KEY,
    queryFn: () => adminGet<{ users: AdminUser[] }>('users').then((r) => r.users),
    staleTime: 0,
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<keyof typeof SORTS>('active');
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? [])
      .filter((u) => !q || u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q))
      .sort(SORTS[sort][1]);
  }, [data, search, sort]);

  const setAdmin = async (u: AdminUser, isAdmin: boolean) => {
    const what = isAdmin
      ? `Make ${u.email} an admin?\n\nThey'll be able to edit and delete shared questions and companies, read feedback and see this page.`
      : `Remove admin access from ${u.email}?`;
    if (!window.confirm(what)) return;
    setBusy(u.id);
    setActionError('');
    try {
      await adminPost('users', { userId: u.id, isAdmin });
      await qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <AdminNav />
      <h1 className="text-xl font-semibold tracking-tight">Users</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Everyone with an account. You see activity counts only, never the text of anyone's answers or stories.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email or name…"
            className="pl-9" aria-label="Search users" />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as keyof typeof SORTS)}>
          <SelectTrigger className="w-44" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([v, [label]]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {actionError && <p className="mb-2 text-sm text-destructive">{actionError}</p>}

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground" data-testid="users-count">
            {users.length} of {data?.length ?? 0} users
          </p>
          <div className="space-y-2">
            {users.map((u) => (
              <Card key={u.id} className="space-y-2 p-4" data-testid="user-row">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.name || u.email}
                      {u.id === me && <span className="font-normal text-muted-foreground"> (you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {u.isAdmin && <Badge className="font-normal">Admin</Badge>}
                  {!u.onboarded && <Badge variant="outline" className="font-normal">Not onboarded</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {u.targetRoleFamily && u.targetLevel
                    ? `Preparing for ${roleTitle(u.targetRoleFamily as RoleFamily, u.targetLevel as RoleLevel)}`
                    : 'No target role yet'}
                  {u.currentPosition && ` · currently ${u.currentPosition}`}
                  {` · joined ${ago(u.createdAt)} · last signed in ${ago(u.lastSignInAt)}`}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <Stat label="Questions practised" value={u.practised} />
                  <Stat label="Answers written" value={u.answers} />
                  <Stat label="Stories" value={u.stories} />
                  <Stat label="Study days" value={u.studyDays} />
                  <span className="text-xs text-muted-foreground">Last studied: {u.lastStudyDay ?? 'never'}</span>
                  {u.id !== me && (
                    <Button size="sm" variant="outline" className="ml-auto" disabled={busy !== null}
                      onClick={() => void setAdmin(u, !u.isAdmin)}>
                      {busy === u.id ? <Loader2 className="animate-spin" /> : u.isAdmin ? <ShieldOff /> : <ShieldCheck />}
                      {u.isAdmin ? 'Remove admin' : 'Make admin'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="font-semibold">{value}</span> <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
