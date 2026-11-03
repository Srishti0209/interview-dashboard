import { useQuery } from '@tanstack/react-query';
import { STORIES_KEY, fetchStories } from '@/lib/stories';
import type { Story } from '@/types';

export function useStories(): Story[] | undefined {
  return useQuery({ queryKey: STORIES_KEY, queryFn: fetchStories }).data;
}
