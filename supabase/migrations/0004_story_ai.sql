-- Phase 6: AI story bank (rich stories, Story Builder, critic) and JD gap
-- analysis. Existing columns and policies are unchanged.

-- Rich story format, Story Builder transcript and critique (see
-- src/lib/storyAi/schemas.ts). The S/T/A/R columns stay filled so the
-- matcher, backups and older clients keep working.
alter table public.stories
  add column details jsonb not null default '{}';

-- JD page: pasted company values, the uploaded file's name and the latest
-- gap analysis.
alter table public.job_descriptions
  add column company_values text not null default '',
  add column file_name text,
  add column gaps jsonb,
  add column updated_at timestamptz not null default now();

create index job_descriptions_user_idx
  on public.job_descriptions (user_id, created_at desc);
