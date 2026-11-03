import { useQuery } from '@tanstack/react-query';
import { MOCK_SESSIONS_KEY, fetchMockSessions } from '@/lib/mock';
import type { MockSession } from '@/types';

/** All mock sessions, newest first. */
export function useMockSessions(): MockSession[] | undefined {
  return useQuery({ queryKey: MOCK_SESSIONS_KEY, queryFn: fetchMockSessions })
    .data;
}
