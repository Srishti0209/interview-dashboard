import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { COMPANIES_KEY } from '@/lib/companies';
import type { AiPolicy, Archetype, RoleFamily } from '@/types';
import type { ReviewStatus } from '@/lib/admin';

// ---------------------------------------------------------------------------
// Admin panel: shared companies and their per-role interview playbooks,
// drafts and binned ones included. Writes go straight to Supabase; admin
// changes are versioned by a trigger (migration 0006).
// ---------------------------------------------------------------------------
export const ADMIN_COMPANIES_KEY = ['admin-companies'] as const;

export interface AdminPlaybook {
  roleFamily: RoleFamily;
  loopStructure: string;
  notes: string;
  status: ReviewStatus;
}

export interface AdminCompany {
  id: string;
  name: string;
  location: string;
  archetype: Archetype;
  aiPolicy: AiPolicy;
  links: { label: string; url: string }[];
  status: ReviewStatus;
  adminEdited: boolean;
  deletedAt: number | null;
  playbooks: AdminPlaybook[];
}

export interface CompanyRow {
  id: string;
  name: string;
  location: string;
  archetype: Archetype;
  ai_policy: AiPolicy;
  links: { label: string; url: string }[];
  review_status: string;
  admin_edited: boolean;
  deleted_at: number | null;
}

export interface PlaybookRow {
  company_id: string;
  role_family: RoleFamily;
  loop_structure: string;
  notes: string;
  review_status: string;
}

const COMPANY_COLUMNS = 'id, name, location, archetype, ai_policy, links, review_status, admin_edited, deleted_at';
const PLAYBOOK_COLUMNS = 'company_id, role_family, loop_structure, notes, review_status';

const status = (s: string): ReviewStatus => (s === 'approved' ? 'approved' : 'draft');

export function playbookFromRow(p: PlaybookRow): AdminPlaybook {
  return {
    roleFamily: p.role_family,
    loopStructure: p.loop_structure,
    notes: p.notes,
    status: status(p.review_status),
  };
}

export function companyFromRow(c: CompanyRow, playbooks: PlaybookRow[] = []): AdminCompany {
  return {
    id: c.id,
    name: c.name,
    location: c.location,
    archetype: c.archetype,
    aiPolicy: c.ai_policy,
    links: c.links ?? [],
    status: status(c.review_status),
    adminEdited: c.admin_edited,
    deletedAt: c.deleted_at === null ? null : Number(c.deleted_at),
    playbooks: playbooks.filter((p) => p.company_id === c.id).map(playbookFromRow),
  };
}

export async function fetchAdminCompanies(): Promise<AdminCompany[]> {
  const [companies, playbooks] = await Promise.all([
    supabase.from('companies').select(COMPANY_COLUMNS).order('name'),
    supabase.from('company_playbooks').select(PLAYBOOK_COLUMNS),
  ]);
  if (companies.error) throw companies.error;
  if (playbooks.error) throw playbooks.error;
  const pbs = playbooks.data as PlaybookRow[];
  return (companies.data as CompanyRow[]).map((c) => companyFromRow(c, pbs));
}

export async function fetchAdminCompany(id: string): Promise<AdminCompany | null> {
  const [company, playbooks] = await Promise.all([
    supabase.from('companies').select(COMPANY_COLUMNS).eq('id', id).maybeSingle(),
    supabase.from('company_playbooks').select(PLAYBOOK_COLUMNS).eq('company_id', id),
  ]);
  if (company.error) throw company.error;
  if (playbooks.error) throw playbooks.error;
  return company.data ? companyFromRow(company.data as CompanyRow, playbooks.data as PlaybookRow[]) : null;
}

export type CompanyInput = Pick<AdminCompany, 'name' | 'location' | 'archetype' | 'aiPolicy' | 'links' | 'status'>;

/** "Acme Pay Ltd" → "acme-pay-ltd", made unique against existing ids. */
async function newCompanyId(name: string): Promise<string> {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company';
  const { data, error } = await supabase.from('companies').select('id').like('id', `${base}%`);
  if (error) throw error;
  const taken = new Set(data.map((r) => r.id));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

/** Creates (no id) or updates a company. Returns its id. */
export async function saveCompany(input: CompanyInput, id?: string): Promise<string> {
  const row = {
    name: input.name.trim(),
    location: input.location.trim(),
    archetype: input.archetype,
    ai_policy: input.aiPolicy,
    links: input.links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label && l.url),
    review_status: input.status,
    admin_edited: true,
  };
  if (id) {
    await updateCompany(id, row);
  } else {
    id = await newCompanyId(row.name);
    const { error } = await supabase.from('companies').insert({ ...row, id });
    if (error) throw error;
  }
  await refresh();
  return id;
}

async function updateCompany(id: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase.from('companies').update(patch).eq('id', id).select('id');
  if (error) throw error;
  if (!data.length) throw notAllowed();
}

/** Saves one role's playbook for a company (creates it if missing). */
export async function savePlaybook(companyId: string, playbook: AdminPlaybook): Promise<void> {
  const { error } = await supabase.from('company_playbooks').upsert(
    {
      company_id: companyId,
      role_family: playbook.roleFamily,
      loop_structure: playbook.loopStructure,
      notes: playbook.notes,
      review_status: playbook.status,
      admin_edited: true,
    },
    { onConflict: 'company_id,role_family' },
  );
  if (error) throw error;
  await refresh();
}

/** Hides a company from users. Their application tracking is kept. */
export async function companyToBin(id: string): Promise<void> {
  await updateCompany(id, { deleted_at: Date.now(), admin_edited: true });
  await refresh();
}

export async function companyFromBin(id: string): Promise<void> {
  await updateCompany(id, { deleted_at: null });
  await refresh();
}

/** Deletes a company, its playbooks and every user's tracking for it. */
export async function deleteCompanyForever(id: string): Promise<void> {
  const { data, error } = await supabase.from('companies').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data.length) throw notAllowed();
  await refresh();
}

const notAllowed = () =>
  new Error('Not saved: your account can’t edit companies, or the company no longer exists.');

async function refresh() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ADMIN_COMPANIES_KEY }),
    queryClient.invalidateQueries({ queryKey: ['admin-company'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-company-versions'] }),
    queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  ]);
}
