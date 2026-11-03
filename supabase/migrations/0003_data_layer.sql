-- Phase 3: move the remaining local data to the account.

-- A user's own questions get their id automatically. The service role (used
-- to load the shared bank) has no auth.uid(), so shared rows stay null.
alter table public.questions alter column owner_id set default auth.uid();

-- Days on which the user reviewed at least one card (drives the streak).
create table public.study_days (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null,
  primary key (user_id, day)
);

alter table public.study_days enable row level security;

create policy "study_days: own rows" on public.study_days
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, delete on public.study_days to authenticated;
grant all on public.study_days to service_role;
