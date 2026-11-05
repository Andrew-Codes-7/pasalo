-- ============================================================================
-- 007 — SECURITY FIXES (November 2026)
-- Run once in Supabase → SQL Editor, AFTER schema.sql and 002–006.
-- Deploy the matching app change (src/lib/profileColumns.ts) at the same time:
-- once this runs, any query that asks profiles for "*" is refused.
--
--   1. HIGH    Any member could read every member's phone number.
--   2. MEDIUM  Someone who received a message could rewrite its text.
--   3. MEDIUM  One side of an exchange could confirm for the other side and
--              complete it alone (free karma, fake completed trades).
--   4. LOW     A seller could change an offer's amount while answering it.
--   5. LOW     Anyone, even signed out, could list every file in the photo
--              bucket. Photos still display by link; listing is now limited
--              to your own folder.
--   6. HIGH    The starter invite codes are published on GitHub. Unused
--              ones are retired, and moderators get a generator for random
--              codes.
--
-- Safe to run more than once. verify.sql still applies afterwards.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. PHONE NUMBERS ARE PRIVATE
-- Row rules decide WHICH profiles you see; column grants decide WHICH FIELDS.
-- Every field except phone stays readable. The signup function writes phone
-- with its own privileges, so signing up is unaffected.
-- ----------------------------------------------------------------------------

revoke select on public.profiles from anon, authenticated;
grant select (id, name, zone_id, bio, avatar_path, phone_verified, email_verified,
              neighbor_verified, is_moderator, karma, rating, review_count,
              given_away, created_at)
  on public.profiles to authenticated;

-- Your own number, for a future "edit profile" screen.
create or replace function public.my_phone()
returns text language sql stable security definer set search_path = public as $$
  select phone from public.profiles where id = auth.uid();
$$;
revoke execute on function public.my_phone() from public, anon;
grant  execute on function public.my_phone() to authenticated;


-- ----------------------------------------------------------------------------
-- 2. MESSAGES: THE RECIPIENT MAY ONLY MARK THEM READ
-- The "mark read" row rule is right about WHO; this limits WHAT to read_at.
-- ----------------------------------------------------------------------------

revoke update on public.messages from anon, authenticated;
grant  update (read_at) on public.messages to authenticated;


-- ----------------------------------------------------------------------------
-- 3. EXCHANGES: EACH SIDE CONFIRMS ONLY FOR ITSELF
-- Runs before on_exchange_confirmed (triggers fire in name order:
-- "guard_..." < "on_..."), so completion still happens normally once both
-- sides have genuinely confirmed.
-- ----------------------------------------------------------------------------

revoke update on public.exchanges from anon, authenticated;
grant  update (confirmed_by_buyer, confirmed_by_seller) on public.exchanges to authenticated;

create or replace function public.guard_exchange_confirmation()
returns trigger language plpgsql as $$
begin
  if auth.uid() is distinct from old.buyer_id then
    new.confirmed_by_buyer := old.confirmed_by_buyer;
  end if;
  if auth.uid() is distinct from old.seller_id then
    new.confirmed_by_seller := old.confirmed_by_seller;
  end if;
  -- Completion is set only by on_exchange_confirmed, never by a client.
  new.completed_at := old.completed_at;
  return new;
end $$;

drop trigger if exists guard_exchange_confirmation on public.exchanges;
create trigger guard_exchange_confirmation
  before update on public.exchanges
  for each row execute function public.guard_exchange_confirmation();


-- ----------------------------------------------------------------------------
-- 4. OFFERS: ANSWERING ONE CAN'T CHANGE THE PRICE
-- ----------------------------------------------------------------------------

revoke update on public.offers from anon, authenticated;
grant  update (status, responded_at) on public.offers to authenticated;


-- ----------------------------------------------------------------------------
-- 5. PHOTO BUCKET: NO LISTING OTHER PEOPLE'S FILES
-- The bucket is public, so photo links keep working with no rule at all.
-- The old rule let anyone enumerate every file. Now you can list (and the
-- delete call can see) only files in your own folder.
-- ----------------------------------------------------------------------------

drop policy if exists listing_photos_read on storage.objects;
drop policy if exists listing_photos_read_own on storage.objects;
create policy listing_photos_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);


-- ----------------------------------------------------------------------------
-- 6. INVITE CODES
-- The five starter codes in schema.sql are public on GitHub. Retire any that
-- were never used, and generate random ones instead:
--     select * from public.create_invites(5);
-- run by a moderator in the app, or as postgres here in the SQL editor.
-- ----------------------------------------------------------------------------

update public.invites
   set expires_at = now()
 where used_by is null
   and code in ('COCO-2026-A','COCO-2026-B','COCO-2026-C','COCO-2026-D','COCO-2026-E');

create or replace function public.create_invites(how_many int default 1, valid_days int default 30)
returns setof text language plpgsql security definer set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text;
  i int; j int;
begin
  -- From the SQL editor (no signed-in user) this is the owner; from the app it
  -- must be a moderator.
  if auth.uid() is not null and not public.is_moderator(auth.uid()) then
    raise exception 'Only moderators can create invite codes.';
  end if;
  if how_many < 1 or how_many > 50 then
    raise exception 'Create between 1 and 50 codes at a time.';
  end if;

  for i in 1..how_many loop
    loop
      -- 12 random characters (about 59 bits): not guessable, even though
      -- check_invite can be called without signing in.
      new_code := 'COCO-';
      for j in 1..12 loop
        new_code := new_code || substr(alphabet, (get_byte(gen_random_bytes(1), 0) % 31) + 1, 1);
      end loop;
      exit when not exists (select 1 from public.invites where code = new_code);
    end loop;
    insert into public.invites (code, created_by, expires_at)
    values (new_code, auth.uid(), now() + make_interval(days => valid_days));
    return next new_code;
  end loop;
end $$;

revoke execute on function public.create_invites(int, int) from public, anon;
grant  execute on function public.create_invites(int, int) to authenticated;
