// Jobs the user is preparing for: the JD text, company values and the latest
// gap analysis. Writes are optimistic and go through the sync outbox, like
// stories.
import { queryClient } from '@/lib/queryClient';
import { fetchAll } from '@/lib/remote';
import { enqueue, waitForPendingWrites } from '@/lib/sync';
import type { JobDescription, JobGaps, JobParsed } from '@/types';

export const JOBS_KEY = ['jobs'] as const;

interface JobRow {
  id: string;
  company: string | null;
  title: string | null;
  raw_text: string;
  company_values: string;
  file_name: string | null;
  interview_date: string | null;
  parsed: JobParsed | null;
  gaps: JobGaps | null;
  created_at: string;
}

const JOB_COLUMNS =
  'id, company, title, raw_text, company_values, file_name, interview_date, parsed, gaps, created_at';

const fromRow = (r: JobRow): JobDescription => ({
  id: r.id,
  company: r.company ?? '',
  title: r.title ?? '',
  rawText: r.raw_text,
  companyValues: r.company_values,
  fileName: r.file_name,
  interviewDate: r.interview_date,
  parsed: r.parsed,
  gaps: r.gaps,
  createdAt: r.created_at,
});

export async function fetchJobs(): Promise<JobDescription[]> {
  await waitForPendingWrites();
  const rows = await fetchAll<JobRow>('job_descriptions', JOB_COLUMNS, 'id');
  return rows.map(fromRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function setJobs(fn: (jobs: JobDescription[]) => JobDescription[]) {
  queryClient.setQueryData<JobDescription[]>(JOBS_KEY, (j) => (j ? fn(j) : j));
}

function toRow(job: Partial<JobDescription>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('company' in job) row.company = job.company;
  if ('title' in job) row.title = job.title;
  if ('rawText' in job) row.raw_text = job.rawText;
  if ('companyValues' in job) row.company_values = job.companyValues;
  if ('fileName' in job) row.file_name = job.fileName;
  if ('interviewDate' in job) row.interview_date = job.interviewDate || null;
  if ('parsed' in job) row.parsed = job.parsed;
  if ('gaps' in job) row.gaps = job.gaps;
  return row;
}

export type JobInput = Pick<JobDescription, 'company' | 'title' | 'rawText' | 'companyValues' | 'fileName' | 'interviewDate'>;

export function createJob(input: JobInput): string {
  const job: JobDescription = {
    id: crypto.randomUUID(),
    ...input,
    parsed: null,
    gaps: null,
    createdAt: new Date().toISOString(),
  };
  setJobs((jobs) => [job, ...jobs]);
  void enqueue({
    type: 'upsert',
    table: 'job_descriptions',
    rows: [{ id: job.id, ...toRow(job), created_at: job.createdAt }],
    onConflict: 'id',
  });
  return job.id;
}

export function updateJob(id: string, patch: Partial<JobDescription>): Promise<void> {
  setJobs((jobs) => jobs.map((j) => (j.id === id ? { ...j, ...patch, id } : j)));
  return enqueue({
    type: 'update',
    table: 'job_descriptions',
    match: { id },
    patch: { ...toRow(patch), updated_at: new Date().toISOString() },
  });
}

export function deleteJob(id: string): Promise<void> {
  setJobs((jobs) => jobs.filter((j) => j.id !== id));
  return enqueue({ type: 'delete', table: 'job_descriptions', match: { id } });
}
