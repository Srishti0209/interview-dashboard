-- Admin tools: edit history and bin, feedback inbox, companies/playbooks
-- editor, AI usage and limits. Adds tables, columns and policies only; no
-- existing data is changed or removed.

-- ---------------------------------------------------------------------------
-- 1. Edit history and bin
-- ---------------------------------------------------------------------------

-- Previous versions of shared content, written by triggers (below) before an
-- admin changes or deletes a row. The content script (service role, no
-- auth.uid()) isn't recorded: the Markdown sources in git are its history.
create table public.content_versions (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('question', 'company', 'playbook')),
  entity_id text not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index content_versions_entity_idx
  on public.content_versions (entity, entity_id, created_at desc);

create or replace function public.record_content_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity text;
  v_id text;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  -- Separate branches: a playbook row has no id column.
  if tg_table_name = 'company_playbooks' then
    v_entity := 'playbook';
    v_id := old.company_id || ':' || old.role_family;
  elsif tg_table_name = 'companies' then
    v_entity := 'company';
    v_id := old.id;
  else
    v_entity := 'question';
    v_id := old.id;
  end if;
  insert into public.content_versions (entity, entity_id, snapshot, changed_by)
  values (v_entity, v_id, to_jsonb(old), auth.uid());
  return coalesce(new, old);
end;
$$;

-- Bin: deleted_at set = hidden from users, restorable by an admin. Their
-- answers and tracking rows stay, because the row itself still exists.
alter table public.questions add column deleted_at bigint;
alter table public.companies
  add column deleted_at bigint,
  add column review_status text not null default 'approved'
    check (review_status in ('draft', 'approved', 'rejected')),
  add column admin_edited boolean not null default false;
alter table public.company_playbooks
  add column admin_edited boolean not null default false;

create trigger questions_version
  before update or delete on public.questions
  for each row when (old.owner_id is null)
  execute function public.record_content_version();
create trigger companies_version
  before update or delete on public.companies
  for each row execute function public.record_content_version();
create trigger company_playbooks_version
  before update or delete on public.company_playbooks
  for each row execute function public.record_content_version();

alter table public.content_versions enable row level security;
create policy "content_versions: admins read" on public.content_versions
  for select to authenticated using ((select public.is_admin()));
grant select on public.content_versions to authenticated;
grant all on public.content_versions to service_role;

-- Users don't see binned or draft content; admins see everything.
drop policy "questions: read shared or own" on public.questions;
create policy "questions: read shared or own" on public.questions
  for select to authenticated using (
    (owner_id is null and review_status = 'approved' and deleted_at is null)
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );
drop policy "companies: read" on public.companies;
create policy "companies: read" on public.companies
  for select to authenticated using (
    (review_status = 'approved' and deleted_at is null)
    or (select public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- 2. Feedback inbox ("Report a problem")
-- ---------------------------------------------------------------------------
alter table public.question_feedback
  add column kind text not null default 'other'
    check (kind in ('wrong_answer', 'typo', 'unclear', 'outdated', 'other')),
  add column resolved_at timestamptz,
  add column resolved_by uuid references auth.users on delete set null;
create index question_feedback_open_idx
  on public.question_feedback (created_at desc) where resolved_at is null;

create policy "question_feedback: admins read" on public.question_feedback
  for select to authenticated using ((select public.is_admin()));
create policy "question_feedback: admins update" on public.question_feedback
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, update on public.question_feedback to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Companies and playbooks editor
-- ---------------------------------------------------------------------------
create policy "companies: admins insert" on public.companies
  for insert to authenticated with check ((select public.is_admin()));
create policy "companies: admins update" on public.companies
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "companies: admins delete" on public.companies
  for delete to authenticated using ((select public.is_admin()));
create policy "playbooks: admins insert" on public.company_playbooks
  for insert to authenticated with check ((select public.is_admin()));
create policy "playbooks: admins update" on public.company_playbooks
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "playbooks: admins delete" on public.company_playbooks
  for delete to authenticated using ((select public.is_admin()));
grant insert, update, delete on public.companies, public.company_playbooks to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Users page: served by api/admin (service role); nothing needed here.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5. AI usage and limits
-- ---------------------------------------------------------------------------
-- Model per call, for cost estimates (older rows: null, estimated by task).
alter table public.ai_usage add column model text;

create policy "ai_usage: admins read" on public.ai_usage
  for select to authenticated using ((select public.is_admin()));

-- App-wide settings edited in the admin panel, e.g. key 'ai_limits'.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);
-- Per-person AI limit overrides, e.g. {"jd": 10}.
create table public.ai_limit_overrides (
  user_id uuid primary key references auth.users on delete cascade,
  limits jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
alter table public.ai_limit_overrides enable row level security;
create policy "app_settings: admins" on public.app_settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "ai_limit_overrides: admins" on public.ai_limit_overrides
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, insert, update, delete on public.app_settings, public.ai_limit_overrides to authenticated;
grant all on public.app_settings, public.ai_limit_overrides to service_role;
