import { useQuery } from '@tanstack/react-query';
import { JOBS_KEY, fetchJobs } from '@/lib/jobs';
import type { JobDescription } from '@/types';

export function useJobs(): JobDescription[] | undefined {
  return useQuery({ queryKey: JOBS_KEY, queryFn: fetchJobs }).data;
}
