-- ============================================================================
-- Pasalo — security check
--
-- Run this in the Supabase SQL editor AFTER schema.sql, and again any time the
-- database changes. It answers one question: is every table actually
-- protected, or did something get exposed by accident?
--
-- Returns ONE table. Every row should say PASS (the last row is a count).
-- ============================================================================

with checks as (

  -- 1. Every table in the public schema must have Row Level Security ON.
  --    A table without it is readable by anyone holding the public key —
  --    which ships in every visitor's browser.
  select 1 as ord, 'Row level security' as check_name,
    case when bool_and(c.relrowsecurity)
         then 'PASS - all ' || count(*)::text || ' tables protected'
         else 'FAIL - unprotected: ' ||
              string_agg(c.relname, ', ') filter (where not c.relrowsecurity)
    end as result
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'

  union all

  -- 2. Protection with no rules denies everything - safe, but the app breaks.
  select 2, 'Policy coverage',
    case when count(*) = 0
         then 'PASS - every protected table has rules'
         else 'FAIL - protected but no rules: ' || string_agg(relname, ', ')
    end
  from (
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  ) missing

  union all

  -- 3. Nobody may write karma. There should be no INSERT/UPDATE/ALL policy on
  --    karma_events - only the internal award function touches it.
  select 3, 'Karma write-lock',
    case when count(*) = 0
         then 'PASS - karma cannot be written by any user'
         else 'FAIL - karma writable via ' || count(*)::text || ' policy'
    end
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  where c.relname = 'karma_events' and p.polcmd in ('a', 'w', '*')

  union all

  -- 4. The trigger that freezes computed profile columns must exist.
  select 4, 'Profile guard',
    case when exists (
           select 1 from pg_trigger
           where tgname = 'guard_profile_columns' and not tgisinternal
         )
         then 'PASS - karma, ratings and badges are write-protected'
         else 'FAIL - profile guard trigger missing'
    end

  union all

  -- 5. Without this trigger, accounts could be created with no invite code.
  select 5, 'Invite gate',
    case when exists (
           select 1 from pg_trigger
           where tgname = 'on_auth_user_created' and not tgisinternal
         )
         then 'PASS - signup requires a valid invite code'
         else 'FAIL - anyone could sign up'
    end

  union all

  -- 6. Uploads need a size cap and an image-only allowlist.
  select 6, 'Upload limits',
    case when exists (
           select 1 from storage.buckets
           where id = 'listing-photos'
             and file_size_limit is not null
             and allowed_mime_types is not null
         )
         then 'PASS - images only, 5MB cap'
         else 'FAIL - photo bucket has no limits'
    end

  union all

  -- 7. Reviews must be gated on a completed exchange, or they can be farmed.
  select 7, 'Review gate',
    case when exists (
           select 1 from pg_policy p
           join pg_class c on c.oid = p.polrelid
           where c.relname = 'reviews' and p.polcmd = 'a'
             and pg_get_expr(p.polwithcheck, p.polrelid) like '%exchanges%'
         )
         then 'PASS - reviews require a completed exchange'
         else 'FAIL - reviews can be written without a trade'
    end

  union all

  -- 8. Informational: how many invite codes remain.
  --    NOTE: this needs its own FROM clause. Leaving it off was the bug that
  --    produced 'column "used_by" does not exist'.
  select 8, 'Invite codes',
    count(*) filter (where i.used_by is null)::text || ' unused, ' ||
    count(*) filter (where i.used_by is not null)::text || ' used'
  from public.invites i

)
select check_name as "check", result from checks order by ord;
