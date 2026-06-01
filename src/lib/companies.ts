import { db } from '@/lib/db';
import type { Company, ApplicationStatus } from '@/types';

export async function updateCompany(
  id: string,
  patch: Partial<Company>,
): Promise<void> {
  await db.companies.update(id, patch);
}

/**
 * Change application status and append a dated entry to the timeline.
 */
export async function setApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const company = await db.companies.get(id);
  if (!company) return;
  const dates = company.applicationDates ?? [];
  // Avoid duplicate consecutive entries for the same stage.
  const last = dates[dates.length - 1];
  const nextDates =
    last && last.stage === status
      ? dates
      : [...dates, { stage: status, date: Date.now() }];
  await db.companies.update(id, {
    applicationStatus: status,
    applicationDates: nextDates,
  });
}
