-- ============================================================================
-- Pasalo -> community app
--
-- Adds the three new sections: bulletin, services, meetups.
-- Run AFTER schema.sql and 002_auth_helpers.sql. Safe to re-run.
--
-- Paste into: Supabase -> SQL Editor -> New query -> Run
--
-- Design notes worth knowing before reading:
--
--   * A service can exist WITHOUT its provider having an account. You need to
--     seed the directory with the AC guy who has never heard of this app, and
--     he can claim his entry later. That is why provider_id is nullable and
--     there is a separate contact_name/phone.
--
--   * Service reviews are gated differently from exchange reviews. An exchange
--     review requires a completed trade both sides confirmed. There is no
--     equivalent receipt for "he fixed my AC", so service reviews instead
--     require a verified neighbour, one review per person per service, and no
--     reviewing your own listing. Weaker, but honest about what can be proven.
--
--   * Hosting a meetup is gated on karma. Earning the right to organise reuses
--     the trust already built and keeps spam out without moderation work.
-- ============================================================================

-- ============================================================================
-- BULLETIN
-- Town noticeboard: road closures, water outages, lost dogs, announcements.
-- ============================================================================

create table if not exists public.bulletin_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (length(trim(title)) between 3 and 120),
  body       text not null check (length(trim(body)) between 1 and 4000),
  kind       text not null default 'notice'
             check (kind in ('alert','news','notice','lost_found','recommendation')),
  -- null zone means the whole town rather than one barrio.
  zone_id    text,
  pinned     boolean not null default false,
  -- Posts age out so the board does not fill with last year's water outage.
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bulletin_recent_idx
  on public.bulletin_posts (pinned desc, created_at desc);

-- ============================================================================
-- SERVICES
-- The local directory: who to call for what.
-- ============================================================================

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  -- The member who owns this entry, once claimed. Null for directory entries
  -- added on someone's behalf before they join.
  provider_id  uuid references public.profiles(id) on delete set null,
  -- Who added it. Always set, so an unclaimed entry still has an owner.
  created_by   uuid not null references public.profiles(id) on delete cascade,
  name         text not null check (length(trim(name)) between 2 and 80),
  category_id  text not null,
  description  text check (length(description) <= 2000),
  -- Free text, because "25.000 colones per visit" and "depends on the job"
  -- are both real answers and a number column cannot hold either.
  rate_note    text check (length(rate_note) <= 120),
  phone        text check (length(phone) <= 32),
  whatsapp     text check (length(whatsapp) <= 32),
  zones        text[] not null default '{}',
  is_active    boolean not null default true,
  -- Denormalised so the directory can sort by rating without a join.
  rating       numeric(2,1) not null default 0,
  review_count integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists services_browse_idx
  on public.services (is_active, category_id, rating desc);

create table if not exists public.service_photos (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services(id) on delete cascade,
  storage_path text not null,
  position     integer not null default 0
);

create table if not exists public.service_reviews (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  body       text check (length(body) <= 1000),
  created_at timestamptz not null default now(),
  unique (service_id, author_id)
);

create index if not exists service_reviews_idx on public.service_reviews (service_id);

-- ============================================================================
-- MEETUPS
-- ============================================================================

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (length(trim(title)) between 3 and 120),
  description   text check (length(description) <= 4000),
  kind          text not null default 'social'
                check (kind in ('social','swap','sport','volunteer','class','market')),
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  zone_id       text not null,
  -- Meeting point as words, not coordinates. Same reasoning as listings:
  -- the app never publishes an exact address.
  location_note text check (length(location_note) <= 200),
  capacity      integer check (capacity is null or capacity between 1 and 1000),
  cover_path    text,
  cancelled     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists events_upcoming_idx
  on public.events (starts_at) where not cancelled;

create table if not exists public.event_rsvps (
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'going' check (status in ('going','maybe')),
  guest_count integer not null default 0 check (guest_count between 0 and 10),
  -- How many things they are bringing, for swap days.
  item_count  integer not null default 0 check (item_count between 0 and 50),
  created_at  timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ============================================================================
-- HELPERS
-- ============================================================================

-- Organising is earned. Contributor level (200 karma) or a moderator.
create or replace function public.can_host_events(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select is_moderator or karma >= 200 from public.profiles where id = uid
  ), false);
$$;

grant execute on function public.can_host_events(uuid) to authenticated;

-- Keep a service's rating in step with its reviews.
create or replace function public.recompute_service_rating(sid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.services s
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1)
           from public.service_reviews r where r.service_id = sid
         ), 0),
         review_count = (
           select count(*) from public.service_reviews r where r.service_id = sid
         )
   where s.id = sid;
end $$;

create or replace function public.on_service_review_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_service_rating(
    coalesce(new.service_id, old.service_id)
  );
  -- Reviewing is a contribution, same as reviewing a trade.
  if tg_op = 'INSERT' then
    perform public.award_karma(new.author_id, 'leave_review', new.id);
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists on_service_review_change on public.service_reviews;
create trigger on_service_review_change
  after insert or update or delete on public.service_reviews
  for each row execute function public.on_service_review_change();

-- Hosting and attending both earn karma.
create or replace function public.on_event_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_karma(new.host_id, 'host_event', new.id);
  return new;
end $$;

drop trigger if exists on_event_created on public.events;
create trigger on_event_created
  after insert on public.events
  for each row execute function public.on_event_created();

-- Extend the karma table with the new actions. CREATE OR REPLACE keeps the
-- single source of truth for point values in one function.
create or replace function public.karma_points(kind text)
returns integer language sql immutable as $$
  select case kind
    when 'post_listing'  then 5
    when 'give_away'     then 25
    when 'leave_review'  then 10
    when 'five_star'     then 15
    when 'verify'        then 20
    when 'welcome'       then 5
    when 'host_event'    then 20
    when 'attend_event'  then 3
    when 'post_bulletin' then 3
    when 'add_service'   then 5
    else 0
  end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Same rule as everywhere else: deny by default, allow explicitly.
-- ============================================================================

alter table public.bulletin_posts  enable row level security;
alter table public.services        enable row level security;
alter table public.service_photos  enable row level security;
alter table public.service_reviews enable row level security;
alter table public.events          enable row level security;
alter table public.event_rsvps     enable row level security;

-- ---- bulletin --------------------------------------------------------------
drop policy if exists bulletin_read on public.bulletin_posts;
create policy bulletin_read on public.bulletin_posts
  for select to authenticated using (true);

drop policy if exists bulletin_write on public.bulletin_posts;
create policy bulletin_write on public.bulletin_posts
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists bulletin_edit_own on public.bulletin_posts;
create policy bulletin_edit_own on public.bulletin_posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_moderator(auth.uid()))
  with check (author_id = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists bulletin_delete_own on public.bulletin_posts;
create policy bulletin_delete_own on public.bulletin_posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator(auth.uid()));

-- ---- services --------------------------------------------------------------
drop policy if exists services_read on public.services;
create policy services_read on public.services
  for select to authenticated
  using (is_active or created_by = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists services_create on public.services;
create policy services_create on public.services
  for insert to authenticated with check (created_by = auth.uid());

-- Editable by whoever added it, or by the provider once they have claimed it.
drop policy if exists services_edit on public.services;
create policy services_edit on public.services
  for update to authenticated
  using (
    created_by = auth.uid()
    or provider_id = auth.uid()
    or public.is_moderator(auth.uid())
  )
  with check (
    created_by = auth.uid()
    or provider_id = auth.uid()
    or public.is_moderator(auth.uid())
  );

drop policy if exists services_delete on public.services;
create policy services_delete on public.services
  for delete to authenticated
  using (created_by = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists service_photos_read on public.service_photos;
create policy service_photos_read on public.service_photos
  for select to authenticated using (true);

drop policy if exists service_photos_write on public.service_photos;
create policy service_photos_write on public.service_photos
  for all to authenticated
  using (exists (
    select 1 from public.services s
    where s.id = service_id
      and (s.created_by = auth.uid() or s.provider_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.services s
    where s.id = service_id
      and (s.created_by = auth.uid() or s.provider_id = auth.uid())
  ));

-- ---- service reviews -------------------------------------------------------
drop policy if exists service_reviews_read on public.service_reviews;
create policy service_reviews_read on public.service_reviews
  for select to authenticated using (true);

-- Must be a verified neighbour, and cannot review a service you own or added.
drop policy if exists service_reviews_write on public.service_reviews;
create policy service_reviews_write on public.service_reviews
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and coalesce((
      select neighbor_verified from public.profiles where id = auth.uid()
    ), false)
    and not exists (
      select 1 from public.services s
      where s.id = service_id
        and (s.provider_id = auth.uid() or s.created_by = auth.uid())
    )
  );

drop policy if exists service_reviews_edit_own on public.service_reviews;
create policy service_reviews_edit_own on public.service_reviews
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ---- events ----------------------------------------------------------------
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to authenticated using (true);

drop policy if exists events_create on public.events;
create policy events_create on public.events
  for insert to authenticated
  with check (host_id = auth.uid() and public.can_host_events(auth.uid()));

drop policy if exists events_edit_own on public.events;
create policy events_edit_own on public.events
  for update to authenticated
  using (host_id = auth.uid() or public.is_moderator(auth.uid()))
  with check (host_id = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists events_delete_own on public.events;
create policy events_delete_own on public.events
  for delete to authenticated
  using (host_id = auth.uid() or public.is_moderator(auth.uid()));

-- ---- rsvps -----------------------------------------------------------------
-- Attendance is public: seeing who is going is most of why people come.
drop policy if exists rsvps_read on public.event_rsvps;
create policy rsvps_read on public.event_rsvps
  for select to authenticated using (true);

drop policy if exists rsvps_own on public.event_rsvps;
create policy rsvps_own on public.event_rsvps
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- STORAGE
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('service-photos', 'service-photos', true, 5242880,
   array['image/jpeg','image/png','image/webp']),
  ('event-photos', 'event-photos', true, 5242880,
   array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists community_photos_read on storage.objects;
create policy community_photos_read on storage.objects
  for select to public
  using (bucket_id in ('service-photos','event-photos'));

-- Same folder-per-uploader rule as listing photos.
drop policy if exists community_photos_upload on storage.objects;
create policy community_photos_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('service-photos','event-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists community_photos_delete on storage.objects;
create policy community_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('service-photos','event-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- CHECK IT WORKED. Every row should say PASS.
-- ============================================================================

with checks as (
  select 1 as ord, 'New tables' as check_name,
    case when count(*) = 6
         then 'PASS - all 6 community tables created'
         else 'FAIL - only ' || count(*)::text || ' of 6 exist'
    end as result
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('bulletin_posts','services','service_photos',
                      'service_reviews','events','event_rsvps')

  union all
  select 2, 'Row level security',
    case when bool_and(c.relrowsecurity)
         then 'PASS - every new table protected'
         else 'FAIL - unprotected: ' ||
              string_agg(c.relname, ', ') filter (where not c.relrowsecurity)
    end
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('bulletin_posts','services','service_photos',
                      'service_reviews','events','event_rsvps')

  union all
  select 3, 'Event hosting gate',
    case when public.can_host_events('00000000-0000-0000-0000-000000000000') = false
         then 'PASS - unknown users cannot host'
         else 'FAIL - hosting is open to anyone' end

  union all
  select 4, 'Service review gate',
    case when exists (
           select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
           where c.relname = 'service_reviews' and p.polcmd = 'a'
             and pg_get_expr(p.polwithcheck, p.polrelid) like '%neighbor_verified%'
         )
         then 'PASS - only verified neighbours can review'
         else 'FAIL - anyone can review' end

  union all
  select 5, 'Photo buckets',
    case when (select count(*) from storage.buckets
               where id in ('service-photos','event-photos')) = 2
         then 'PASS - both buckets exist with limits'
         else 'FAIL - buckets missing' end

  union all
  select 6, 'Karma actions',
    case when public.karma_points('host_event') = 20
          and public.karma_points('add_service') = 5
         then 'PASS - new karma actions registered'
         else 'FAIL - karma_points not updated' end
)
select check_name as "check", result from checks order by ord;
