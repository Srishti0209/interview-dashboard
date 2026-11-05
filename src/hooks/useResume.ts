import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { useProfile } from '@/hooks/useProfile';
import { getResume, saveResume } from '@/lib/resume';

/** The user's active resume, or null when they haven't added one. */
export function useActiveResume() {
  const resumeId = useProfile().data?.activeResumeId ?? null;
  return useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResume(resumeId!),
    enabled: Boolean(resumeId),
  });
}

export function useSaveResume() {
  const userId = useSession()?.user.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, file }: { text: string; file?: File }) =>
      saveResume(userId!, text, file),
    onSuccess: (resume) => {
      qc.setQueryData(['resume', resume.id], resume);
      return qc.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
