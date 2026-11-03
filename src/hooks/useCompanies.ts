import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { COMPANIES_KEY, fetchCompanyData, mergeCompanies } from '@/lib/companies';
import type { Company } from '@/types';

/** Companies with the loop playbook for the user's target role. */
export function useCompanies(): Company[] | undefined {
  const data = useQuery({ queryKey: COMPANIES_KEY, queryFn: fetchCompanyData })
    .data;
  const role = useProfile().data?.targetRoleFamily ?? null;
  return useMemo(() => (data ? mergeCompanies(data, role) : undefined), [data, role]);
}

/** `undefined` while loading, `null` if not found, else the company. */
export function useCompany(
  id: string | undefined,
): Company | null | undefined {
  const companies = useCompanies();
  return useMemo(() => {
    if (!companies) return undefined;
    return (id && companies.find((c) => c.id === id)) || null;
  }, [companies, id]);
}
