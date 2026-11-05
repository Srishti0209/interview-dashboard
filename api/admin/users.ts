// GET  /api/admin/users → { users: AdminUser[] }: everyone with an account,
//      their profile and activity counts (never the text of their answers).
// POST /api/admin/users { userId, isAdmin } → { ok: true }: grant or remove
//      admin. Admins can't change their own flag, so there's always one left.
import type { User } from '@supabase/supabase-js';
import { requireAdmin, selectAll } from '../_lib/admin.js';
import { HttpError, handle, json, readJson } from '../_lib/http.js';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  currentPosition: string | null;
  targetRoleFamily: string | null;
  targetLevel: string | null;
  onboarded: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  practised: number;
  answers: number;
  stories: number;
  studyDays: number;
  lastStudyDay: string | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  current_position: string | null;
  target_role_family: string | null;
  target_level: string | null;
  onboarded: boolean;
  is_admin: boolean;
}

const countBy = (rows: { user_id: string }[]) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
  return m;
};

export const GET = handle(async (req) => {
  const { admin } = await requireAdmin(req);

  const authUsers: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [profiles, practised, answers, stories, days] = await Promise.all([
    selectAll<ProfileRow>(admin, 'profiles',
      'id, display_name, current_position, target_role_family, target_level, onboarded, is_admin'),
    selectAll<{ user_id: string }>(admin, 'user_question_state', 'user_id', { positive: 'review_count' }),
    selectAll<{ user_id: string }>(admin, 'user_question_state', 'user_id', { nonEmpty: 'personal_answer' }),
    selectAll<{ user_id: string }>(admin, 'stories', 'user_id'),
    selectAll<{ user_id: string; day: string }>(admin, 'study_days', 'user_id, day'),
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const practisedBy = countBy(practised);
  const answersBy = countBy(answers);
  const storiesBy = countBy(stories);
  const daysBy = countBy(days);
  const lastDay = new Map<string, string>();
  for (const d of days) if (d.day > (lastDay.get(d.user_id) ?? '')) lastDay.set(d.user_id, d.day);

  const users: AdminUser[] = authUsers.map((u) => {
    const p = profileById.get(u.id);
    return {
      id: u.id,
      email: u.email ?? '',
      name: p?.display_name ?? null,
      currentPosition: p?.current_position ?? null,
      targetRoleFamily: p?.target_role_family ?? null,
      targetLevel: p?.target_level ?? null,
      onboarded: p?.onboarded ?? false,
      isAdmin: p?.is_admin ?? false,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      practised: practisedBy.get(u.id) ?? 0,
      answers: answersBy.get(u.id) ?? 0,
      stories: storiesBy.get(u.id) ?? 0,
      studyDays: daysBy.get(u.id) ?? 0,
      lastStudyDay: lastDay.get(u.id) ?? null,
    };
  });
  users.sort((a, b) => (b.lastSignInAt ?? '').localeCompare(a.lastSignInAt ?? ''));
  return json({ users });
});

export const POST = handle(async (req) => {
  const { admin, userId } = await requireAdmin(req);
  const body = await readJson<{ userId?: unknown; isAdmin?: unknown }>(req);
  if (typeof body.userId !== 'string' || typeof body.isAdmin !== 'boolean') {
    throw new HttpError(400, 'bad_request', 'Send { userId, isAdmin }.');
  }
  if (body.userId === userId) {
    throw new HttpError(400, 'bad_request', 'You can’t change your own admin access.');
  }
  const { data, error } = await admin
    .from('profiles')
    .update({ is_admin: body.isAdmin })
    .eq('id', body.userId)
    .select('id');
  if (error) throw error;
  if (!data.length) throw new HttpError(404, 'not_found', 'No such user.');
  return json({ ok: true });
});
