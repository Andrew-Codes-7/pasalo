-- ============================================================================
-- Pasalo - remove the demo content
--
-- Deletes exactly what 005_demo_content.sql added and nothing else. Every
-- demo row has an id starting 'ddddddd', so anything you or a neighbour
-- posted is untouched.
--
-- Run this whenever you are done showing the app around.
-- ============================================================================

delete from public.listing_photos where listing_id::text like 'ddddddd%';
delete from public.listings       where id::text like 'ddddddd%';
delete from public.events         where id::text like 'ddddddd%';
delete from public.bulletin_posts where id::text like 'ddddddd%';
delete from public.services       where id::text like 'ddddddd%';

select 'Demo content removed' as result,
  (select count(*) from public.listings)       || ' listings remain, ' ||
  (select count(*) from public.services)       || ' services, ' ||
  (select count(*) from public.events)         || ' meetups, ' ||
  (select count(*) from public.bulletin_posts) || ' bulletin posts'
  as whats_left;
