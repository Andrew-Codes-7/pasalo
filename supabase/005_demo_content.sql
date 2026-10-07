-- ============================================================================
-- Pasalo - demo content
--
-- Fills every section with realistic content posted under YOUR account, so the
-- app can be shown to people instead of described.
--
-- Run AFTER 004_moderation.sql. Safe to re-run (it replaces its own rows).
-- Remove it all later with 006_remove_demo_content.sql.
--
-- Two things worth knowing:
--
--   * Every row uses an id starting 'ddddddd' so removal is exact. Nothing
--     you post yourself will ever be caught by the cleanup.
--
--   * The approval triggers are switched off around the inserts and switched
--     back on after. In the SQL editor there is no signed-in user, so
--     auth.uid() is null and every row would otherwise land as 'pending' with
--     no way to approve it from here.
--
--   * Business names are invented. Using a real company in screenshots you
--     share implies they endorsed this, which they have not. Swap in real
--     names once you have asked them.
-- ============================================================================

do $$
declare
  me uuid;
  admin_email text := 'admin@example.com';   -- <<< CHANGE IF NEEDED
begin
  select id into me from auth.users where lower(email) = lower(admin_email);
  if me is null then
    raise exception 'No account found for %. Sign up first.', admin_email;
  end if;
  raise notice 'Seeding demo content under %', admin_email;
end $$;

-- Triggers off: no signed-in user here, so status would be forced to pending.
alter table public.services       disable trigger set_status_services;
alter table public.services       disable trigger guard_status_services;
alter table public.events         disable trigger set_status_events;
alter table public.events         disable trigger guard_status_events;
alter table public.bulletin_posts disable trigger set_status_bulletin;
alter table public.bulletin_posts disable trigger guard_status_bulletin;

-- ============================================================================
-- SERVICES
-- ============================================================================
delete from public.services where id::text like 'ddddddd%';

insert into public.services
  (id, created_by, provider_id, name, category_id, description, rate_note,
   phone, whatsapp, zones, status, is_active, rating, review_count)
select
  v.id::uuid, u.id, null, v.name, v.cat, v.descr, v.rate,
  v.phone, v.phone, v.zones, 'approved', true, v.rating, v.reviews
from (values
  ('ddddddd1-0000-4000-8000-000000000001',
   'Coco Beach Realty', 'realestate',
   'Sales and long-term rentals around Coco, Ocotal and Hermosa. Bilingual, and they handle the escrow and lawyer side for you.',
   'commission, free valuation', '+506 2670 1100',
   array['coco','ocotal','hermosa'], 4.8, 12),

  ('ddddddd1-0000-4000-8000-000000000002',
   'Piscinas Claras', 'garden',
   'Weekly pool service — chemicals, filter, skim. Been doing our place for three years and the water has never gone green.',
   'about $60 a month weekly', '+506 8712 4455',
   array['coco','ocotal','artola'], 5.0, 8),

  ('ddddddd1-0000-4000-8000-000000000003',
   'Jorge - AC repair', 'construction',
   'Fixed our mini-split the same afternoon we called. Fair price, explains what he is doing, speaks decent English.',
   '₡25.000 a visit plus parts', '+506 8845 9021',
   array['coco','sardinal','ocotal'], 4.9, 15),

  ('ddddddd1-0000-4000-8000-000000000004',
   'Taxi Marvin 24/7', 'transport',
   'Airport runs to Liberia, and he will actually answer at 4am. Fixed price agreed before you get in.',
   '$45 to LIR airport', '+506 8601 7788',
   array['coco','ocotal','hermosa','panama','liberia'], 4.7, 23),

  ('ddddddd1-0000-4000-8000-000000000005',
   'Limpieza Doña Rosa', 'cleaning',
   'House cleaning, weekly or one-off. Brings her own supplies. Very thorough with the salt residue on windows.',
   '₡15.000 for a half day', '+506 8733 2019',
   array['coco','artola','sardinal'], 5.0, 11),

  ('ddddddd1-0000-4000-8000-000000000006',
   'Coco Surf School', 'tutoring',
   'Lessons for all levels at Playa Coco and Ocotal. Boards and rash guards included. Good with nervous beginners and kids.',
   '$40 a lesson, less for groups', '+506 8890 3344',
   array['coco','ocotal'], 4.9, 19),

  ('ddddddd1-0000-4000-8000-000000000007',
   'Veterinaria Guanacaste', 'pets',
   'Vet clinic in Sardinal. Vaccines, spay and neuter, and they do house calls for anything that will not travel.',
   'consultation ₡18.000', '+506 2697 0055',
   array['sardinal','coco','artola'], 4.6, 7),

  ('ddddddd1-0000-4000-8000-000000000008',
   'Wilson - internet & TV', 'tech',
   'Sorts out routers, extenders and streaming boxes. Knows which providers actually work in which barrio, which saves a lot of guessing.',
   '₡20.000 a call-out', '+506 8455 6612',
   array['coco','ocotal','hermosa','sardinal'], 4.8, 9)
) as v(id, name, cat, descr, rate, phone, zones, rating, reviews)
cross join (
  select id from auth.users where lower(email) = lower('admin@example.com')
) u;

-- ============================================================================
-- MEETUPS
-- Dates are relative to when you run this, so nothing is ever in the past.
-- ============================================================================
delete from public.events where id::text like 'ddddddd%';

insert into public.events
  (id, host_id, title, description, kind, starts_at, zone_id,
   location_note, capacity, status)
select
  v.id::uuid, u.id, v.title, v.descr, v.kind,
  date_trunc('day', now()) + v.offset_days * interval '1 day' + v.at_hour * interval '1 hour',
  v.zone, v.loc, v.cap, 'approved'
from (values
  ('ddddddd2-0000-4000-8000-000000000001',
   'Sunday market at the plaza', 'market',
   'Produce, bread, coffee and crafts from around Guanacaste. Bring a bag and small bills — most stalls cannot break a 20.',
   3, 7, 'coco', 'Plaza in Centro, by the church', null),

  ('ddddddd2-0000-4000-8000-000000000002',
   'Coco beach cleanup', 'volunteer',
   'An hour along the main beach before it gets hot. Bags and gloves provided. Kids welcome — last time we filled eleven sacks.',
   6, 7, 'coco', 'Meet at the main beach entrance', 40),

  ('ddddddd2-0000-4000-8000-000000000003',
   'Pasalo swap day', 'swap',
   'Bring anything you are giving away and take whatever you need. No money changes hands. Tag your listings as "bringing" so people know what to expect.',
   10, 9, 'coco', 'Basketball court, Centro park', null),

  ('ddddddd2-0000-4000-8000-000000000004',
   'Sunset beach volleyball', 'sport',
   'Casual games, all levels. We rotate teams so nobody sits out. Someone usually brings a cooler.',
   2, 16, 'hermosa', 'North end of Playa Hermosa', 24),

  ('ddddddd2-0000-4000-8000-000000000005',
   'Spanish conversation hour', 'class',
   'Informal practice over coffee. Ticos and gringos both welcome — half the point is that everyone is learning something.',
   5, 10, 'coco', 'Cafe on the main road, back tables', 16)
) as v(id, title, kind, descr, offset_days, at_hour, zone, loc, cap)
cross join (
  select id from auth.users where lower(email) = lower('admin@example.com')
) u;

-- ============================================================================
-- BULLETIN
-- ============================================================================
delete from public.bulletin_posts where id::text like 'ddddddd%';

insert into public.bulletin_posts
  (id, author_id, title, body, kind, zone_id, pinned, expires_at, status, created_at)
select
  v.id::uuid, u.id, v.title, v.body, v.kind, v.zone, v.pinned,
  now() + v.expires_days * interval '1 day', 'approved',
  now() - v.age_hours * interval '1 hour'
from (values
  ('ddddddd3-0000-4000-8000-000000000001',
   'Water off in Sardinal Thursday morning', 
   'AyA are working on the main line. Expect no water from about 7am until midday, maybe later. Fill what you need Wednesday night.',
   'alert', 'sardinal', true, 5, 3),

  ('ddddddd3-0000-4000-8000-000000000002',
   'New bakery open by the roundabout',
   'Panaderia opened this week next to the hardware store. Fresh bread from 6am and the empanadas sell out by nine. Cash only for now.',
   'news', 'coco', false, 21, 20),

  ('ddddddd3-0000-4000-8000-000000000003',
   'Lost: brown dog, answers to Chico',
   'Slipped his collar near the beach entrance Sunday evening. Medium size, brown with a white chest, very friendly. Call or WhatsApp if you see him.',
   'lost_found', 'coco', false, 14, 32),

  ('ddddddd3-0000-4000-8000-000000000004',
   'Road work on the Sardinal road',
   'One lane closed between the school and the bridge for the next two weeks. Add fifteen minutes if you are heading to Liberia in the morning.',
   'alert', null, false, 14, 50),

  ('ddddddd3-0000-4000-8000-000000000005',
   'Farmers market moved to 7am',
   'Starting this week the Sunday market opens an hour earlier to beat the heat. Same place, same stalls.',
   'notice', 'coco', false, 10, 72),

  ('ddddddd3-0000-4000-8000-000000000006',
   'Turtle nesting season - lights off on the beach',
   'Nesting has started at Playa Ocotal. Please keep torches and phone lights off near the sand after dark, and fill in any holes you dig.',
   'notice', 'ocotal', false, 60, 96)
) as v(id, title, body, kind, zone, pinned, expires_days, age_hours)
cross join (
  select id from auth.users where lower(email) = lower('admin@example.com')
) u;

-- ============================================================================
-- EXCHANGE LISTINGS
-- Photos point at the sample images already bundled with the app.
-- ============================================================================
delete from public.listings where id::text like 'ddddddd%';

insert into public.listings
  (id, seller_id, title, description, price_usd, category_id, zone_id,
   condition, status, accent, created_at)
select
  v.id::uuid, u.id, v.title, v.descr, v.price, v.cat, v.zone,
  v.cond, 'available', v.accent, now() - v.age_hours * interval '1 hour'
from (values
  ('ddddddd4-0000-4000-8000-000000000001',
   'Inflatable paddleboard, pump included', 'Second season, no leaks. Pump, leash and three-piece paddle all there. Rolls into its own bag.',
   240, 'outdoors', 'hermosa', 'like-new', '#1f4c5e', 6),
  ('ddddddd4-0000-4000-8000-000000000002',
   'Beach cruiser, recently serviced', 'New tubes and brake pads last month. Salt has taken the chrome on the bars but it rides beautifully.',
   85, 'vehicles', 'coco', 'good', '#2a4f56', 14),
  ('ddddddd4-0000-4000-8000-000000000003',
   'Rattan porch chairs, pair', 'Weathered but solid. No cushions. Would come up lovely with a sand and a coat of oil.',
   120, 'furniture', 'coco', 'good', '#5e5233', 28),
  ('ddddddd4-0000-4000-8000-000000000004',
   'Monstera cuttings, rooted', 'Six rooted cuttings from the big plant on our porch. Free — bring your own pot. Any afternoon.',
   null, 'home', 'artola', 'new', '#2b4a2e', 36),
  ('ddddddd4-0000-4000-8000-000000000005',
   'Cordless drill and bit set', 'Two batteries, both hold charge. Case is cracked, everything inside is fine.',
   55, 'tools', 'coco', 'good', '#6b3a26', 48),
  ('ddddddd4-0000-4000-8000-000000000006',
   'Pedestal fan - free to a good home', 'Loud on high but moves plenty of air. Height adjustment sticks. Free, just come get it.',
   null, 'free', 'coco', 'fair', '#444c52', 8),
  ('ddddddd4-0000-4000-8000-000000000007',
   'Camping tent, sleeps four', 'Rainfly, footprint and pegs all present. Stored dry indoors. One zipper pull replaced.',
   65, 'outdoors', 'coco', 'good', '#35492f', 60),
  ('ddddddd4-0000-4000-8000-000000000008',
   'Box of paperbacks', 'About thirty books, mostly English with some Spanish. Take the box or just what you fancy.',
   null, 'free', 'coco', 'fair', '#4a3f33', 72),
  ('ddddddd4-0000-4000-8000-000000000009',
   'Laptop, fine for browsing', 'Battery lasts about two hours now. Screen and keyboard perfect. Wiped and reinstalled already.',
   220, 'electronics', 'ocotal', 'fair', '#3b444a', 90),
  ('ddddddd4-0000-4000-8000-000000000010',
   'Snorkel set, adult', 'Mask, snorkel and fins, used maybe four times. Silicone still soft, no fogging.',
   25, 'outdoors', 'ocotal', 'like-new', '#1d4f63', 18)
) as v(id, title, descr, price, cat, zone, cond, accent, age_hours)
cross join (
  select id from auth.users where lower(email) = lower('admin@example.com')
) u;

delete from public.listing_photos where listing_id::text like 'ddddddd%';

insert into public.listing_photos (listing_id, storage_path, position)
values
  ('ddddddd4-0000-4000-8000-000000000001', '/samples/paddleboard-2.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000001', '/samples/paddleboard-1.jpg', 1),
  ('ddddddd4-0000-4000-8000-000000000002', '/samples/toddler-bike-2.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000003', '/samples/rattan-chairs-2.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000004', '/samples/monstera-1.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000005', '/samples/drill-1.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000006', '/samples/pedestal-fan-1.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000007', '/samples/tent-2.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000008', '/samples/paperbacks-1.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000009', '/samples/laptop-1.jpg', 0),
  ('ddddddd4-0000-4000-8000-000000000010', '/samples/snorkel-2.jpg', 0);

-- Triggers back on.
alter table public.services       enable trigger set_status_services;
alter table public.services       enable trigger guard_status_services;
alter table public.events         enable trigger set_status_events;
alter table public.events         enable trigger guard_status_events;
alter table public.bulletin_posts enable trigger set_status_bulletin;
alter table public.bulletin_posts enable trigger guard_status_bulletin;

-- ============================================================================
-- WHAT LANDED
-- ============================================================================
select 'Services'  as section, count(*)::text as added from public.services       where id::text like 'ddddddd%'
union all
select 'Meetups',  count(*)::text from public.events         where id::text like 'ddddddd%'
union all
select 'Bulletin', count(*)::text from public.bulletin_posts where id::text like 'ddddddd%'
union all
select 'Listings', count(*)::text from public.listings       where id::text like 'ddddddd%';
