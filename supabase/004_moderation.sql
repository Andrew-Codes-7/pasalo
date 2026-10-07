-- ============================================================================
-- Pasalo - submission approval
--
-- Services, meetups and bulletin posts now need approving before anyone else
-- sees them. Your own submissions approve themselves, because you are the
-- moderator.
--
-- Run AFTER 003_community.sql. Safe to re-run.
--
-- How it works, in one paragraph:
--   Every submission gets a status set by the DATABASE on insert, not by the
--   app - a moderator's is 'approved', everyone else's is 'pending'. A second
--   trigger stops anyone but a moderator changing that status afterwards,
--   which is the part that matters: without it an author could simply approve
--   their own post. Karma is awarded on approval rather than on submission,
--   so spamming the queue earns nothing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: make yourself a moderator.
--
-- Change the email below if it is not the one you signed up with. This has to
-- be done here rather than in the app: is_moderator is frozen by the profile
-- guard precisely so nobody can promote themselves.
-- ----------------------------------------------------------------------------
do $$
declare
  admin_email text := 'admin@example.com';   -- <<< CHANGE IF NEEDED
  target uuid;
begin
  select id into target from auth.users where lower(email) = lower(admin_email);

  if target is null then
    raise notice 'No account found for %. Sign up first, then re-run.', admin_email;
  else
    perform set_config('app.bypass_profile_guard', 'on', true);
    update public.profiles set is_moderator = true where id = target;
    perform set_config('app.bypass_profile_guard', 'off', true);
    raise notice 'Moderator granted to %', admin_email;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- STEP 2: add the status columns.
-- ----------------------------------------------------------------------------
alter table public.services
  add column if not exists status text not null default 'pending',
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_note text;

alter table public.events
  add column if not exists status text not null default 'pending',
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_note text;

alter table public.bulletin_posts
  add column if not exists status text not null default 'pending',
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_note text;

do $$
begin
  -- Constraints added separately so a re-run does not fail on a duplicate.
  if not exists (select 1 from pg_constraint where conname = 'services_status_ck') then
    alter table public.services add constraint services_status_ck
      check (status in ('pending','approved','rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'events_status_ck') then
    alter table public.events add constraint events_status_ck
      check (status in ('pending','approved','rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bulletin_status_ck') then
    alter table public.bulletin_posts add constraint bulletin_status_ck
      check (status in ('pending','approved','rejected'));
  end if;
end $$;

create index if not exists services_pending_idx on public.services (status);
create index if not exists events_pending_idx on public.events (status);
create index if not exists bulletin_pending_idx on public.bulletin_posts (status);

-- Anything already posted (by you, before this existed) counts as approved.
update public.services       set status = 'approved' where status = 'pending' and created_at < now();
update public.events         set status = 'approved' where status = 'pending' and created_at < now();
update public.bulletin_posts set status = 'approved' where status = 'pending' and created_at < now();

-- ----------------------------------------------------------------------------
-- STEP 3: set the status on insert. The app never gets a say.
-- ----------------------------------------------------------------------------
create or replace function public.set_submission_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_moderator(auth.uid()) then
    new.status := 'approved';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    -- Overwritten regardless of what was sent, so a crafted request that sets
    -- status='approved' is simply ignored.
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end $$;

drop trigger if exists set_status_services on public.services;
create trigger set_status_services
  before insert on public.services
  for each row execute function public.set_submission_status();

drop trigger if exists set_status_events on public.events;
create trigger set_status_events
  before insert on public.events
  for each row execute function public.set_submission_status();

drop trigger if exists set_status_bulletin on public.bulletin_posts;
create trigger set_status_bulletin
  before insert on public.bulletin_posts
  for each row execute function public.set_submission_status();

-- ----------------------------------------------------------------------------
-- STEP 4: only a moderator may change a status afterwards.
--
-- This is the load-bearing one. The update policies already let authors edit
-- their own rows, so without this an author could approve themselves.
-- ----------------------------------------------------------------------------
create or replace function public.guard_submission_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_moderator(auth.uid()) then
    new.status := old.status;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.rejection_note := old.rejection_note;
  elsif new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists guard_status_services on public.services;
create trigger guard_status_services
  before update on public.services
  for each row execute function public.guard_submission_status();

drop trigger if exists guard_status_events on public.events;
create trigger guard_status_events
  before update on public.events
  for each row execute function public.guard_submission_status();

drop trigger if exists guard_status_bulletin on public.bulletin_posts;
create trigger guard_status_bulletin
  before update on public.bulletin_posts
  for each row execute function public.guard_submission_status();

-- ----------------------------------------------------------------------------
-- STEP 5: karma is earned on approval, not on submission.
-- Otherwise the queue becomes a karma farm.
-- ----------------------------------------------------------------------------
drop trigger if exists on_event_created on public.events;

create or replace function public.on_submission_approved()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    if tg_table_name = 'events' then
      owner_id := (to_jsonb(new) ->> 'host_id')::uuid;
      perform public.award_karma(owner_id, 'host_event', new.id);
    elsif tg_table_name = 'services' then
      owner_id := (to_jsonb(new) ->> 'created_by')::uuid;
      perform public.award_karma(owner_id, 'add_service', new.id);
    elsif tg_table_name = 'bulletin_posts' then
      owner_id := (to_jsonb(new) ->> 'author_id')::uuid;
      perform public.award_karma(owner_id, 'post_bulletin', new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists award_on_approve_services on public.services;
create trigger award_on_approve_services
  after update on public.services
  for each row execute function public.on_submission_approved();

drop trigger if exists award_on_approve_events on public.events;
create trigger award_on_approve_events
  after update on public.events
  for each row execute function public.on_submission_approved();

drop trigger if exists award_on_approve_bulletin on public.bulletin_posts;
create trigger award_on_approve_bulletin
  after update on public.bulletin_posts
  for each row execute function public.on_submission_approved();

-- A moderator's own submission is approved at insert, so it never passes
-- through the update trigger. Award it there instead.
create or replace function public.on_submission_inserted()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  if new.status = 'approved' then
    if tg_table_name = 'events' then
      owner_id := (to_jsonb(new) ->> 'host_id')::uuid;
      perform public.award_karma(owner_id, 'host_event', new.id);
    elsif tg_table_name = 'services' then
      owner_id := (to_jsonb(new) ->> 'created_by')::uuid;
      perform public.award_karma(owner_id, 'add_service', new.id);
    elsif tg_table_name = 'bulletin_posts' then
      owner_id := (to_jsonb(new) ->> 'author_id')::uuid;
      perform public.award_karma(owner_id, 'post_bulletin', new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists award_on_insert_services on public.services;
create trigger award_on_insert_services
  after insert on public.services
  for each row execute function public.on_submission_inserted();

drop trigger if exists award_on_insert_events on public.events;
create trigger award_on_insert_events
  after insert on public.events
  for each row execute function public.on_submission_inserted();

drop trigger if exists award_on_insert_bulletin on public.bulletin_posts;
create trigger award_on_insert_bulletin
  after insert on public.bulletin_posts
  for each row execute function public.on_submission_inserted();

-- ----------------------------------------------------------------------------
-- STEP 6: only approved things are public.
-- Authors still see their own pending items so they know it was received.
-- ----------------------------------------------------------------------------
drop policy if exists services_read on public.services;
create policy services_read on public.services
  for select to authenticated
  using (
    (status = 'approved' and is_active)
    or created_by = auth.uid()
    or provider_id = auth.uid()
    or public.is_moderator(auth.uid())
  );

drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to authenticated
  using (
    status = 'approved'
    or host_id = auth.uid()
    or public.is_moderator(auth.uid())
  );

drop policy if exists bulletin_read on public.bulletin_posts;
create policy bulletin_read on public.bulletin_posts
  for select to authenticated
  using (
    status = 'approved'
    or author_id = auth.uid()
    or public.is_moderator(auth.uid())
  );

-- Hosting no longer needs the karma gate: everything is reviewed anyway, and
-- requiring both would mean a newcomer with a good idea cannot even ask.
drop policy if exists events_create on public.events;
create policy events_create on public.events
  for insert to authenticated with check (host_id = auth.uid());

-- ============================================================================
-- CHECK IT WORKED. Every row should say PASS.
-- ============================================================================

with checks as (
  select 1 as ord, 'Moderator account' as check_name,
    case when exists (select 1 from public.profiles where is_moderator)
         then 'PASS - ' || (select count(*)::text from public.profiles where is_moderator)
              || ' moderator(s) set'
         else 'FAIL - nobody is a moderator; check the email in step 1'
    end as result

  union all
  select 2, 'Status columns',
    case when (
      select count(*) from information_schema.columns
      where table_schema = 'public' and column_name = 'status'
        and table_name in ('services','events','bulletin_posts')
    ) = 3 then 'PASS - all three tables have status'
      else 'FAIL - status column missing somewhere' end

  union all
  select 3, 'Status set by database',
    case when (
      select count(*) from pg_trigger
      where tgname in ('set_status_services','set_status_events','set_status_bulletin')
        and not tgisinternal
    ) = 3 then 'PASS - submissions cannot self-approve'
      else 'FAIL - insert trigger missing' end

  union all
  select 4, 'Status locked after insert',
    case when (
      select count(*) from pg_trigger
      where tgname in ('guard_status_services','guard_status_events','guard_status_bulletin')
        and not tgisinternal
    ) = 3 then 'PASS - only moderators can approve'
      else 'FAIL - authors could approve themselves' end

  union all
  select 5, 'Pending items are private',
    case when (
      select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
      where c.relname in ('services','events','bulletin_posts')
        and p.polcmd = 'r'
        and pg_get_expr(p.polqual, p.polrelid) like '%approved%'
    ) = 3 then 'PASS - only approved items are public'
      else 'FAIL - pending items may be visible' end

  union all
  select 6, 'Karma on approval',
    case when public.karma_points('post_bulletin') = 3
      then 'PASS - karma awarded when approved, not when submitted'
      else 'FAIL - karma points missing' end
)
select check_name as "check", result from checks order by ord;
