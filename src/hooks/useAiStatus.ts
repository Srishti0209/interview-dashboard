import { useQuery } from '@tanstack/react-query';
import { fetchAiStatus, type AiStatus } from '@/lib/storyAi/client';

const OFF: AiStatus = {
  enabled: false,
  fixture: false,
  remaining: { resume: 0, read: 0, chat: 0, write: 0, critique: 0, jd: 0 },
};

export const AI_STATUS_KEY = ['ai-status'] as const;

/**
 * Whether the automatic AI path is available, and today's remaining runs.
 * Shows "off" (hand-off only) while the API can't be reached, but a failed
 * check is retried and never cached as the answer (it isn't persisted
 * either; see App.tsx), so a server restart doesn't leave AI switched off.
 */
export function useAiStatus() {
  const query = useQuery({
    queryKey: AI_STATUS_KEY,
    queryFn: fetchAiStatus,
    staleTime: 60_000,
    retry: 2,
  });
  return {
    status: query.data ?? (query.isError ? OFF : undefined),
    isLoading: query.isLoading,
    refresh: query.refetch,
  };
}
