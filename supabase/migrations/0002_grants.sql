-- Explicit table privileges. Newer Supabase projects no longer grant public
-- tables to the API roles by default; RLS (0001) still decides which rows.
-- anon gets nothing: every feature requires sign-in.

grant usage on schema public to authenticated, service_role;

-- Shared content: read-only for users.
grant select on public.companies, public.company_playbooks to authenticated;

-- Questions: read shared + own; write own (enforced by RLS).
grant select, insert, update, delete on public.questions to authenticated;

-- Owner-only tables.
grant select, insert, update, delete on
  public.resumes,
  public.user_question_state,
  public.notes,
  public.revisions,
  public.stories,
  public.user_company_state,
  public.job_descriptions,
  public.mock_sessions
to authenticated;

grant insert on public.question_feedback to authenticated;
grant select on public.ai_usage, public.ai_jobs to authenticated;

-- Profiles: read own; UPDATE is column-limited in 0001.
grant select on public.profiles to authenticated;

grant execute on function public.is_admin() to authenticated;

-- Server-side code (API functions, content scripts) uses the service role.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
