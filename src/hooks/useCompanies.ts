import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Company } from '@/types';

export function useCompanies(): Company[] | undefined {
  return useLiveQuery(() => db.companies.toArray(), []);
}

/** `undefined` while loading, `null` if not found, else the company. */
export function useCompany(
  id: string | undefined,
): Company | null | undefined {
  return useLiveQuery(
    async () => (id ? ((await db.companies.get(id)) ?? null) : null),
    [id],
  );
}
