-- ============================================================================
-- Pasalo — auth helpers (run this AFTER schema.sql)
--
-- Two small functions the signup flow needs. Safe to re-run.
--
-- Paste into: Supabase → SQL Editor → New query → Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Check an invite code before showing the rest of the signup form.
--
-- The invites table has no public read policy on purpose — codes must not be
-- browsable. This function runs with elevated rights but returns only a
-- yes/no, so it can answer "is this code good?" without ever exposing the
-- list. It deliberately does not say whether a bad code is unknown, used, or
-- expired; that would help someone guessing.
-- ----------------------------------------------------------------------------
create or replace function public.check_invite(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invites i
    where upper(i.code) = upper(trim(p_code))
      and i.used_by is null
      and (i.expires_at is null or i.expires_at > now())
  );
$$;

grant execute on function public.check_invite(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Flag the signed-in user's email as confirmed.
--
-- profiles.email_verified is frozen by the guard trigger, so it can only be
-- set through the same bypass the karma functions use. This is called from the
-- email confirmation link handler.
-- ----------------------------------------------------------------------------
create or replace function public.mark_email_verified()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set email_verified = true where id = auth.uid();
  perform set_config('app.bypass_profile_guard', 'off', true);
end $$;

grant execute on function public.mark_email_verified() to authenticated;

-- ----------------------------------------------------------------------------
-- Confirm it worked. Both rows should say PASS.
-- ----------------------------------------------------------------------------
select 'check_invite' as fn,
  case when public.check_invite('definitely-not-a-real-code') = false
       then 'PASS - rejects an unknown code'
       else 'FAIL - accepted a bogus code' end as result
union all
select 'mark_email_verified',
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'mark_email_verified'
  ) then 'PASS - function created' else 'FAIL - not created' end;
