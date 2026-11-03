import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { getProfile, updateProfile, type ProfilePatch } from '@/lib/profile';

export function useProfile() {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId!),
    enabled: Boolean(userId),
    // Show the cached profile instantly, but always re-check on load so
    // changes made on another device show up.
    staleTime: 0,
  });
}

export function useUpdateProfile() {
  const userId = useSession()?.user.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => updateProfile(userId!, patch),
    onSuccess: (profile) => qc.setQueryData(['profile', userId], profile),
  });
}
