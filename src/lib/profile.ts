import { supabase } from '@/lib/supabase';
import type { Profile, RoleFamily, RoleLevel } from '@/types';

interface ProfileRow {
  id: string;
  display_name: string | null;
  current_position: string | null;
  target_role_family: RoleFamily | null;
  target_level: RoleLevel | null;
  onboarded: boolean;
  active_resume_id: string | null;
}

const COLUMNS =
  'id, display_name, current_position, target_role_family, target_level, onboarded, active_resume_id';

function fromRow(r: ProfileRow): Profile {
  return {
    id: r.id,
    displayName: r.display_name,
    currentPosition: r.current_position,
    targetRoleFamily: r.target_role_family,
    targetLevel: r.target_level,
    onboarded: r.onboarded,
    activeResumeId: r.active_resume_id,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', userId)
    .single();
  if (error) throw error;
  return fromRow(data as ProfileRow);
}

export type ProfilePatch = Partial<Omit<Profile, 'id'>>;

export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<Profile> {
  const row: Partial<ProfileRow> = {};
  if ('displayName' in patch) row.display_name = patch.displayName ?? null;
  if ('currentPosition' in patch)
    row.current_position = patch.currentPosition ?? null;
  if ('targetRoleFamily' in patch)
    row.target_role_family = patch.targetRoleFamily ?? null;
  if ('targetLevel' in patch) row.target_level = patch.targetLevel ?? null;
  if ('onboarded' in patch) row.onboarded = patch.onboarded ?? false;
  if ('activeResumeId' in patch)
    row.active_resume_id = patch.activeResumeId ?? null;

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return fromRow(data as ProfileRow);
}
