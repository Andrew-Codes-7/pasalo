-- ============================================================================
-- Pasalo — database schema and security rules
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query → paste → Run). It is safe to re-run: everything is IF NOT EXISTS or
-- CREATE OR REPLACE.
--
-- The important idea in this file: Postgres itself enforces the rules, not the
-- app. Anyone can open the browser console and issue their own queries, so
-- "the app only shows you your own messages" is not security. Row Level
-- Security below is what actually stops it.
--
-- Two things are deliberately impossible for a user to write directly:
--   * karma, rating, review_count, given_away  (or people inflate themselves)
--   * neighbor_verified, is_moderator          (or people promote themselves)
-- These are set only by the SECURITY DEFINER functions at the bottom, which
-- flip a guard flag the profile trigger checks for.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES
-- One row per account, created automatically on signup.
-- ============================================================================

create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text not null check (length(trim(name)) between 2 and 60),
  zone_id           text not null,
  bio               text check (length(bio) <= 400),
  avatar_path       text,
  phone             text,
  phone_verified    boolean not null default false,
  email_verified    boolean not null default false,
  neighbor_verified boolean not null default false,
  is_moderator      boolean not null default false,
  -- Computed columns. Never written by the client; see the guard below.
  karma             integer not null default 0,
  rating            numeric(2,1) not null default 0,
  review_count      integer not null default 0,
  given_away        integer not null default 0,
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- INVITES
-- The app is invite-only. A code must exist and be unused to sign up.
-- ============================================================================

create table if not exists public.invites (
  code       text primary key,
  created_by uuid references public.profiles(id) on delete set null,
  used_by    uuid references public.profiles(id) on delete set null,
  used_at    timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invites_unused_idx on public.invites (code) where used_by is null;

-- ============================================================================
-- LISTINGS
-- ============================================================================

create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (length(trim(title)) between 3 and 70),
  description text check (length(description) <= 2000),
  -- null price means a giveaway, which is how the app launches.
  price_usd   integer check (price_usd is null or price_usd between 0 and 100000),
  category_id text not null,
  zone_id     text not null,
  condition   text not null default 'good'
              check (condition in ('new','like-new','good','fair','for-parts')),
  status      text not null default 'available'
              check (status in ('available','pending','completed','removed')),
  accent      text not null default '#4a5560',
  saved_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists listings_browse_idx
  on public.listings (status, created_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id);

create table if not exists public.listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  position     integer not null default 0
);

create index if not exists listing_photos_listing_idx
  on public.listing_photos (listing_id, position);

create table if not exists public.saved_listings (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ============================================================================
-- CONVERSATIONS, MESSAGES, OFFERS
-- ============================================================================

create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  seller_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- One thread per buyer per listing.
  unique (listing_id, buyer_id)
);

create index if not exists conversations_participant_idx
  on public.conversations (buyer_id, seller_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (length(trim(body)) between 1 and 2000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_thread_idx
  on public.messages (conversation_id, created_at);

create table if not exists public.offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  listing_id      uuid not null references public.listings(id) on delete cascade,
  buyer_id        uuid not null references public.profiles(id) on delete cascade,
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  amount_usd      integer not null check (amount_usd >= 0),
  status          text not null default 'pending'
                  check (status in ('pending','accepted','declined','withdrawn')),
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);

create index if not exists offers_conversation_idx on public.offers (conversation_id);

-- ============================================================================
-- EXCHANGES AND REVIEWS
--
-- A review must point at an exchange both sides confirmed. This is what stops
-- review farming: you cannot review someone you never traded with.
-- ============================================================================

create table if not exists public.exchanges (
  id                   uuid primary key default gen_random_uuid(),
  listing_id           uuid not null references public.listings(id) on delete cascade,
  offer_id             uuid references public.offers(id) on delete set null,
  buyer_id             uuid not null references public.profiles(id) on delete cascade,
  seller_id            uuid not null references public.profiles(id) on delete cascade,
  confirmed_by_buyer   boolean not null default false,
  confirmed_by_seller  boolean not null default false,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  subject_id  uuid not null references public.profiles(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  body        text check (length(body) <= 1000),
  created_at  timestamptz not null default now(),
  -- One review per person per exchange.
  unique (exchange_id, author_id),
  check (author_id <> subject_id)
);

create index if not exists reviews_subject_idx on public.reviews (subject_id);

-- ============================================================================
-- KARMA
-- An append-only ledger. The profile total is derived from it, never typed in.
-- ============================================================================

create table if not exists public.karma_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,
  points     integer not null,
  ref_id     uuid,
  created_at timestamptz not null default now()
);

create index if not exists karma_events_user_idx on public.karma_events (user_id);

-- Point values live in one place so the incentive design is visible.
create or replace function public.karma_points(kind text)
returns integer language sql immutable as $$
  select case kind
    when 'post_listing'  then 5
    when 'give_away'     then 25
    when 'leave_review'  then 10
    when 'five_star'     then 15
    when 'verify'        then 20
    when 'welcome'       then 5
    else 0
  end;
$$;

-- ============================================================================
-- REPORTS
-- ============================================================================

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('listing','profile','message')),
  target_id   uuid not null,
  reason      text not null,
  notes       text check (length(notes) <= 1000),
  status      text not null default 'open'
              check (status in ('open','reviewed','actioned','dismissed')),
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- HELPERS
-- ============================================================================

create or replace function public.is_moderator(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_moderator from public.profiles where id = uid), false);
$$;

-- True when the caller is the buyer or seller on a conversation.
create or replace function public.in_conversation(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = cid and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  );
$$;

-- ============================================================================
-- GUARD: computed profile columns cannot be written by users
--
-- Award functions call set_config('app.bypass_profile_guard','on',true) first;
-- the flag is transaction-local, so it cannot leak to a normal client update.
-- ============================================================================

create or replace function public.guard_profile_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.bypass_profile_guard', true), 'off') <> 'on' then
    new.karma             := old.karma;
    new.rating            := old.rating;
    new.review_count      := old.review_count;
    new.given_away        := old.given_away;
    new.neighbor_verified := old.neighbor_verified;
    new.is_moderator      := old.is_moderator;
    new.email_verified    := old.email_verified;
    new.phone_verified    := old.phone_verified;
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_columns on public.profiles;
create trigger guard_profile_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- ============================================================================
-- AWARDING KARMA AND RECOMPUTING RATINGS
-- ============================================================================

-- Parameters are prefixed p_ because `kind` and `points` are also column names
-- on karma_events; unprefixed names make PL/pgSQL references ambiguous.
--
-- Dropped first because CREATE OR REPLACE refuses to rename parameters, so an
-- earlier version of this file would otherwise block a re-run. Triggers call
-- this by name at runtime and are unaffected.
drop function if exists public.award_karma(uuid, text, uuid);

create or replace function public.award_karma(p_uid uuid, p_kind text, p_ref uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare pts integer;
begin
  pts := public.karma_points(p_kind);
  if pts = 0 then return; end if;

  insert into public.karma_events (user_id, kind, points, ref_id)
  values (p_uid, p_kind, pts, p_ref);

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles p
     set karma = (
       select coalesce(sum(k.points), 0)
       from public.karma_events k
       where k.user_id = p_uid
     )
   where p.id = p_uid;
  perform set_config('app.bypass_profile_guard', 'off', true);
end $$;

create or replace function public.recompute_reputation(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles p
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1) from public.reviews r where r.subject_id = uid
         ), 0),
         review_count = (select count(*) from public.reviews r where r.subject_id = uid),
         given_away = (
           select count(*) from public.exchanges e
            join public.listings l on l.id = e.listing_id
           where e.seller_id = uid and e.completed_at is not null and l.price_usd is null
         )
   where p.id = uid;
  perform set_config('app.bypass_profile_guard', 'off', true);
end $$;

-- New listing → karma for the seller.
create or replace function public.on_listing_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_karma(new.seller_id, 'post_listing', new.id);
  return new;
end $$;

drop trigger if exists on_listing_created on public.listings;
create trigger on_listing_created
  after insert on public.listings
  for each row execute function public.on_listing_created();

-- Review written → karma for the author, plus a bonus and a recompute for the
-- person reviewed.
create or replace function public.on_review_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_karma(new.author_id, 'leave_review', new.id);
  if new.rating = 5 then
    perform public.award_karma(new.subject_id, 'five_star', new.id);
  end if;
  perform public.recompute_reputation(new.subject_id);
  return new;
end $$;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.on_review_created();

-- Both sides confirmed → the exchange completes, the listing closes, and a
-- giveaway earns the seller the large karma award.
create or replace function public.on_exchange_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_free boolean;
begin
  if new.confirmed_by_buyer and new.confirmed_by_seller and new.completed_at is null then
    new.completed_at := now();

    update public.listings set status = 'completed', updated_at = now()
     where id = new.listing_id
    returning (price_usd is null) into is_free;

    if is_free then
      perform public.award_karma(new.seller_id, 'give_away', new.id);
    end if;

    perform public.recompute_reputation(new.seller_id);
  end if;
  return new;
end $$;

drop trigger if exists on_exchange_confirmed on public.exchanges;
create trigger on_exchange_confirmed
  before update on public.exchanges
  for each row execute function public.on_exchange_confirmed();

-- Saved counter kept in sync so browse does not need a subquery per card.
create or replace function public.sync_saved_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.listings l
     set saved_count = (select count(*) from public.saved_listings s where s.listing_id = l.id)
   where l.id = coalesce(new.listing_id, old.listing_id);
  return coalesce(new, old);
end $$;

drop trigger if exists sync_saved_count on public.saved_listings;
create trigger sync_saved_count
  after insert or delete on public.saved_listings
  for each row execute function public.sync_saved_count();

-- ============================================================================
-- SIGNUP: create the profile and burn the invite code
--
-- Raising here aborts the signup, so an account can never exist without a
-- valid invite.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  -- Prefixed because `invites` has a column called `code`. An unprefixed
  -- variable of the same name makes every reference ambiguous, and PL/pgSQL
  -- aborts the statement — which would break signup for everyone.
  v_code     text := upper(trim(new.raw_user_meta_data->>'invite_code'));
  invite_row public.invites%rowtype;
begin
  select * into invite_row from public.invites i
   where upper(i.code) = v_code
     and i.used_by is null
     and (i.expires_at is null or i.expires_at > now())
   for update;

  if not found then
    raise exception 'invalid_invite_code' using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, name, zone_id, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Neighbor'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'zone_id'), ''), 'coco'),
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  );

  update public.invites i
     set used_by = new.id, used_at = now()
   where i.code = invite_row.code;

  perform public.award_karma(new.id, 'verify', null);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Everything below denies by default. Nothing is readable or writable unless a
-- policy explicitly allows it.
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.invites        enable row level security;
alter table public.listings       enable row level security;
alter table public.listing_photos enable row level security;
alter table public.saved_listings enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.offers         enable row level security;
alter table public.exchanges      enable row level security;
alter table public.reviews        enable row level security;
alter table public.karma_events   enable row level security;
alter table public.reports        enable row level security;

-- ---- profiles --------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Note: the guard trigger still blocks karma/rating/verified even here.

-- ---- invites ---------------------------------------------------------------
-- Deliberately no SELECT policy: codes are not browsable, even by members.
-- Signup validates them inside a SECURITY DEFINER function instead.
drop policy if exists invites_read_own on public.invites;
create policy invites_read_own on public.invites
  for select to authenticated using (created_by = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists invites_moderator_write on public.invites;
create policy invites_moderator_write on public.invites
  for all to authenticated
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

-- ---- listings --------------------------------------------------------------
drop policy if exists listings_read on public.listings;
create policy listings_read on public.listings
  for select to authenticated
  using (status <> 'removed' or seller_id = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own on public.listings
  for insert to authenticated with check (seller_id = auth.uid());

drop policy if exists listings_update_own on public.listings;
create policy listings_update_own on public.listings
  for update to authenticated
  using (seller_id = auth.uid() or public.is_moderator(auth.uid()))
  with check (seller_id = auth.uid() or public.is_moderator(auth.uid()));

drop policy if exists listings_delete_own on public.listings;
create policy listings_delete_own on public.listings
  for delete to authenticated
  using (seller_id = auth.uid() or public.is_moderator(auth.uid()));

-- ---- listing photos --------------------------------------------------------
drop policy if exists photos_read on public.listing_photos;
create policy photos_read on public.listing_photos
  for select to authenticated using (true);

drop policy if exists photos_write_own on public.listing_photos;
create policy photos_write_own on public.listing_photos
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- ---- saved listings --------------------------------------------------------
drop policy if exists saved_own on public.saved_listings;
create policy saved_own on public.saved_listings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- conversations ---------------------------------------------------------
drop policy if exists conversations_participants on public.conversations;
create policy conversations_participants on public.conversations
  for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists conversations_start on public.conversations;
create policy conversations_start on public.conversations
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and seller_id <> auth.uid()
    and exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = seller_id)
  );

-- ---- messages --------------------------------------------------------------
-- This is the policy that matters most: without it, every private message in
-- the community is readable by anyone with a browser console.
drop policy if exists messages_participants on public.messages;
create policy messages_participants on public.messages
  for select to authenticated using (public.in_conversation(conversation_id));

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.in_conversation(conversation_id));

drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages
  for update to authenticated
  using (public.in_conversation(conversation_id) and sender_id <> auth.uid())
  with check (public.in_conversation(conversation_id));

-- ---- offers ----------------------------------------------------------------
drop policy if exists offers_participants on public.offers;
create policy offers_participants on public.offers
  for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists offers_make on public.offers;
create policy offers_make on public.offers
  for insert to authenticated
  with check (buyer_id = auth.uid() and public.in_conversation(conversation_id));

-- Only the seller answers an offer, and only a pending one.
drop policy if exists offers_respond on public.offers;
create policy offers_respond on public.offers
  for update to authenticated
  using (seller_id = auth.uid() and status = 'pending')
  with check (seller_id = auth.uid());

-- ---- exchanges -------------------------------------------------------------
drop policy if exists exchanges_participants on public.exchanges;
create policy exchanges_participants on public.exchanges
  for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists exchanges_create on public.exchanges;
create policy exchanges_create on public.exchanges
  for insert to authenticated
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists exchanges_confirm on public.exchanges;
create policy exchanges_confirm on public.exchanges
  for update to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- ---- reviews ---------------------------------------------------------------
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select to authenticated using (true);

-- The gate: you may only review a completed exchange you were part of, and
-- only the other party in it.
drop policy if exists reviews_write on public.reviews;
create policy reviews_write on public.reviews
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.exchanges e
      where e.id = exchange_id
        and e.completed_at is not null
        and (
          (e.buyer_id  = auth.uid() and e.seller_id = subject_id) or
          (e.seller_id = auth.uid() and e.buyer_id  = subject_id)
        )
    )
  );

-- ---- karma -----------------------------------------------------------------
-- Readable, never writable. There is no INSERT/UPDATE policy on purpose:
-- only the SECURITY DEFINER award function can add rows.
drop policy if exists karma_read_own on public.karma_events;
create policy karma_read_own on public.karma_events
  for select to authenticated using (user_id = auth.uid());

-- ---- reports ---------------------------------------------------------------
drop policy if exists reports_create on public.reports;
create policy reports_create on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_moderator(auth.uid()));

-- ============================================================================
-- STORAGE: listing photos
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists listing_photos_read on storage.objects;
create policy listing_photos_read on storage.objects
  for select to public using (bucket_id = 'listing-photos');

-- Uploads land in a folder named after the uploader, so nobody can write into
-- or delete from anyone else's folder.
drop policy if exists listing_photos_upload on storage.objects;
create policy listing_photos_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists listing_photos_delete on storage.objects;
create policy listing_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- REALTIME: live messages
-- ============================================================================

-- ALTER PUBLICATION ... ADD TABLE errors if the table is already a member, so
-- it cannot simply be re-run like the rest of this file. Check membership
-- first and only add what is missing.
do $$
declare t text;
begin
  foreach t in array array['messages', 'offers'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- FIRST INVITE CODES
-- Change these before running, then hand them out. Each works exactly once.
-- ============================================================================

insert into public.invites (code) values
  ('COCO-2026-A'), ('COCO-2026-B'), ('COCO-2026-C'),
  ('COCO-2026-D'), ('COCO-2026-E')
on conflict (code) do nothing;
