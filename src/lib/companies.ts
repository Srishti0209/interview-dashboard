import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { enqueue, waitForPendingWrites } from '@/lib/sync';
import type {
  Company,
  ApplicationStatus,
  Archetype,
  AiPolicy,
  RoleFamily,
} from '@/types';

export const COMPANIES_KEY = ['companies'] as const;

interface CompanyRow {
  id: string;
  name: string;
  location: string;
  archetype: Archetype;
  ai_policy: AiPolicy;
  links: { label: string; url: string }[];
}

interface PlaybookRow {
  company_id: string;
  role_family: RoleFamily;
  loop_structure: string;
  notes: string;
}

interface CompanyStateRow {
  company_id: string;
  application_status: ApplicationStatus | null;
  application_notes: string | null;
  application_dates: { stage: string; date: number }[];
}

/** Shared company info, every role's playbook, and the user's tracking. */
export interface CompanyData {
  companies: CompanyRow[];
  playbooks: PlaybookRow[];
  states: CompanyStateRow[];
}

export async function fetchCompanyData(): Promise<CompanyData> {
  await waitForPendingWrites();
  const [companies, playbooks, states] = await Promise.all([
    fetchAll<CompanyRow>('companies', 'id, name, location, archetype, ai_policy, links', 'id'),
    fetchAll<PlaybookRow>(
      'company_playbooks',
      'company_id, role_family, loop_structure, notes',
      'company_id,role_family',
    ),
    fetchAll<CompanyStateRow>(
      'user_company_state',
      'company_id, application_status, application_notes, application_dates',
      'company_id',
    ),
  ]);
  return { companies, playbooks, states };
}

/**
 * Builds the Company objects the pages use. The loop playbook is the one for
 * the user's target role, falling back to the frontend playbook (the original
 * content) for roles that don't have one yet.
 */
export function mergeCompanies(
  data: CompanyData,
  role: RoleFamily | null,
): Company[] {
  const states = new Map(data.states.map((s) => [s.company_id, s]));
  return data.companies
    .map((c): Company => {
      const forCompany = data.playbooks.filter((p) => p.company_id === c.id);
      const playbook =
        forCompany.find((p) => p.role_family === role) ??
        forCompany.find((p) => p.role_family === 'frontend') ??
        forCompany[0];
      const s = states.get(c.id);
      return {
        id: c.id,
        name: c.name,
        location: c.location,
        archetype: c.archetype,
        aiPolicy: c.ai_policy,
        links: c.links,
        loopStructure: playbook?.loop_structure ?? '',
        notes: playbook?.notes ?? '',
        applicationStatus: s?.application_status ?? undefined,
        applicationNotes: s?.application_notes ?? undefined,
        applicationDates: s?.application_dates,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getState(id: string): CompanyStateRow | undefined {
  return queryClient
    .getQueryData<CompanyData>(COMPANIES_KEY)
    ?.states.find((s) => s.company_id === id);
}

/** Optimistically updates and saves the user's tracking for a company. */
function saveState(id: string, patch: Partial<Omit<CompanyStateRow, 'company_id'>>) {
  queryClient.setQueryData<CompanyData>(COMPANIES_KEY, (d) => {
    if (!d) return d;
    const exists = d.states.some((s) => s.company_id === id);
    const states = exists
      ? d.states.map((s) => (s.company_id === id ? { ...s, ...patch } : s))
      : [
          ...d.states,
          {
            company_id: id,
            application_status: null,
            application_notes: null,
            application_dates: [],
            ...patch,
          },
        ];
    return { ...d, states };
  });
  return enqueue({
    type: 'upsert',
    table: 'user_company_state',
    rows: [{ company_id: id, ...patch }],
    onConflict: 'user_id,company_id',
  });
}

/** Only the user's own tracking fields can change; company info is shared. */
export async function updateCompany(
  id: string,
  patch: Partial<Company>,
): Promise<void> {
  const row: Partial<Omit<CompanyStateRow, 'company_id'>> = {};
  if ('applicationStatus' in patch)
    row.application_status = patch.applicationStatus ?? null;
  if ('applicationNotes' in patch)
    row.application_notes = patch.applicationNotes ?? null;
  if ('applicationDates' in patch)
    row.application_dates = patch.applicationDates ?? [];
  if (Object.keys(row).length) void saveState(id, row);
}

/**
 * Change application status and append a dated entry to the timeline.
 */
export async function setApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const dates = getState(id)?.application_dates ?? [];
  // Avoid duplicate consecutive entries for the same stage.
  const last = dates[dates.length - 1];
  const nextDates =
    last && last.stage === status
      ? dates
      : [...dates, { stage: status, date: Date.now() }];
  void saveState(id, {
    application_status: status,
    application_dates: nextDates,
  });
}
