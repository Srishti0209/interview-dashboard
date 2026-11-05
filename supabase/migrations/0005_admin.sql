-- Admin panel: admins edit the shared question bank from the app.
--
-- - admins (profiles.is_admin) may insert, update and delete shared questions
--   (owner_id null); everyone else still only writes their own.
-- - admin_edited marks rows changed in the panel, so the content script
--   (scripts/content/load-seed.mjs) never overwrites them.
-- is_admin can only be set here (users can't update that column).

alter table public.questions
  add column if not exists admin_edited boolean not null default false;

create policy "questions: admins insert shared" on public.questions
  for insert to authenticated
  with check (owner_id is null and (select public.is_admin()));
create policy "questions: admins update shared" on public.questions
  for update to authenticated
  using (owner_id is null and (select public.is_admin()))
  with check (owner_id is null and (select public.is_admin()));
create policy "questions: admins delete shared" on public.questions
  for delete to authenticated
  using (owner_id is null and (select public.is_admin()));

-- The first admin. Add more with the same statement and their email.
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'srishti.nimish@gmail.com');
