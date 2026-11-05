-- Interview Prep: multi-user schema.
--
-- Conventions:
-- - Ids are text so existing local ids (UUID strings) import unchanged.
-- - Fields that mirror the app's TypeScript types (createdAt, nextDue, …) are
--   bigint epoch milliseconds, matching src/types so the data layer maps 1:1.
-- - Server-only metadata uses timestamptz.
-- - Shared content (questions with owner_id null, companies, playbooks) is
--   readable by any signed-in user and writable only by the service role.
-- - Everything else is private to its owner via RLS.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  -- "current_role" is reserved in Postgres, hence current_position.
  current_position text,
  target_role_family text check (
    target_role_family in ('product_owner', 'backend', 'frontend', 'fullstack', 'ai')
  ),
  target_level text check (target_level in ('mid', 'senior', 'staff')),
  onboarded boolean not null default false,
  is_admin boolean not null default false,
  active_resume_id uuid,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Shared content
-- ---------------------------------------------------------------------------
create table public.questions (
  id text primary key default gen_random_uuid()::text,
  -- null = shared bank question; set = the user's own (custom or AI-generated)
  owner_id uuid references auth.users on delete cascade,
  role_families text[] not null default '{}',
  levels text[] not null default '{}',
  round_type text not null,
  title text not null,
  body text not null default '',
  answer text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  company text[] not null default '{}',
  tags text[] not null default '{}',
  source text not null check (source in ('seed', 'ai', 'user')),
  review_status text not null default 'approved'
    check (review_status in ('draft', 'approved', 'rejected')),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index questions_owner_idx on public.questions (owner_id);
create index questions_role_families_idx on public.questions using gin (role_families);
create index questions_round_type_idx on public.questions (round_type);

create table public.companies (
  id text primary key,
  name text not null,
  location text not null default '',
  archetype text not null,
  ai_policy text not null,
  links jsonb not null default '[]'
);

create table public.company_playbooks (
  company_id text not null references public.companies on delete cascade,
  role_family text not null check (
    role_family in ('product_owner', 'backend', 'frontend', 'fullstack', 'ai')
  ),
  loop_structure text not null default '',
  notes text not null default '',
  review_status text not null default 'approved'
    check (review_status in ('draft', 'approved', 'rejected')),
  primary key (company_id, role_family)
);

-- ---------------------------------------------------------------------------
-- Per-user data
-- ---------------------------------------------------------------------------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  storage_path text, -- null when the user pasted text instead of uploading
  file_name text,
  extracted_text text not null,
  parsed jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_active_resume_fk
  foreign key (active_resume_id) references public.resumes on delete set null;

create table public.user_question_state (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  question_id text not null references public.questions on delete cascade,
  personal_answer text,
  personal_notes text,
  bookmarked boolean not null default false,
  -- SM-2 review state (mirrors ReviewState)
  confidence smallint not null default 0 check (confidence between 0 and 5),
  last_reviewed bigint,
  next_due bigint,
  interval_days real not null default 0,
  ease_factor real not null default 2.5,
  review_count integer not null default 0,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (user_id, question_id)
);
create index user_question_state_due_idx on public.user_question_state (user_id, next_due);

create table public.notes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null default '',
  body_json jsonb not null default '{}',
  tags text[] not null default '{}',
  linked_question_ids text[] not null default '{}',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);

-- Overwritten versions kept on sync conflicts, so nothing is silently lost.
create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  entity text not null check (entity in ('note', 'answer')),
  entity_id text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.stories (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  situation text not null default '',
  task text not null default '',
  action text not null default '',
  result text not null default '',
  metrics text not null default '',
  applicable_to text[] not null default '{}',
  tags text[] not null default '{}',
  source text not null default 'user' check (source in ('ai', 'user')),
  is_draft boolean not null default false,
  resume_id uuid references public.resumes on delete set null,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index stories_user_idx on public.stories (user_id);

create table public.user_company_state (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  company_id text not null references public.companies on delete cascade,
  application_status text check (application_status in (
    'not_applied', 'applied', 'phone_screen', 'onsite', 'offer', 'rejected', 'declined'
  )),
  application_notes text,
  application_dates jsonb not null default '[]',
  primary key (user_id, company_id)
);

create table public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  company text,
  title text,
  raw_text text not null,
  parsed jsonb,
  interview_date date,
  created_at timestamptz not null default now()
);

create table public.mock_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  started_at bigint not null,
  ended_at bigint,
  round_types text[] not null default '{}',
  company_id text references public.companies on delete set null,
  jd_id uuid references public.job_descriptions on delete set null,
  role_family text,
  self_rating smallint,
  notes text,
  transcript jsonb not null default '[]',
  feedback jsonb
);
create index mock_sessions_user_started_idx on public.mock_sessions (user_id, started_at desc);

create table public.question_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  question_id text not null references public.questions on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- Written only by the server (service role); users can read their own.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);
create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed')),
  steps jsonb not null default '[]',
  input jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_jobs_user_idx on public.ai_jobs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.companies enable row level security;
alter table public.company_playbooks enable row level security;
alter table public.resumes enable row level security;
alter table public.user_question_state enable row level security;
alter table public.notes enable row level security;
alter table public.revisions enable row level security;
alter table public.stories enable row level security;
alter table public.user_company_state enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.mock_sessions enable row level security;
alter table public.question_feedback enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_jobs enable row level security;

-- Profiles: read/update own row. Users may not touch is_admin, so UPDATE is
-- granted only on the editable columns. Inserts come from the trigger.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (display_name, current_position, target_role_family, target_level,
              onboarded, active_resume_id)
  on public.profiles to authenticated;

-- Questions: approved shared questions + own questions; admins see drafts.
create policy "questions: read shared or own" on public.questions
  for select to authenticated using (
    (owner_id is null and review_status = 'approved')
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );
create policy "questions: insert own" on public.questions
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "questions: update own" on public.questions
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "questions: delete own" on public.questions
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "companies: read" on public.companies
  for select to authenticated using (true);

create policy "playbooks: read approved" on public.company_playbooks
  for select to authenticated
  using (review_status = 'approved' or (select public.is_admin()));

-- Owner-only tables: full CRUD on own rows.
do $$
declare t text;
begin
  foreach t in array array[
    'resumes', 'user_question_state', 'notes', 'revisions', 'stories',
    'user_company_state', 'job_descriptions', 'mock_sessions'
  ] loop
    execute format(
      'create policy "%1$s: own rows" on public.%1$I for all to authenticated '
      'using (user_id = (select auth.uid())) '
      'with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;

create policy "question_feedback: insert own" on public.question_feedback
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "ai_usage: read own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

create policy "ai_jobs: read own" on public.ai_jobs
  for select to authenticated using (user_id = (select auth.uid()));

-- Let the UI watch background job progress live.
alter publication supabase_realtime add table public.ai_jobs;

-- ---------------------------------------------------------------------------
-- Storage: private resumes bucket, files under "{user_id}/…"
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do nothing;

create policy "resumes bucket: own folder" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
