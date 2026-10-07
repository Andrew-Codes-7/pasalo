import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { Listing, User } from "./types";
import type { ListingRow, ProfileRow } from "./supabase/types";

/**
 * Reading real listings out of the database.
 *
 * The screens were built against the sample data in lib/data.ts, so rather
 * than rewrite them, rows are mapped into the same shape those components
 * already understand. That keeps this change to the data layer instead of
 * touching every view.
 */

function publicUrl(base: string, path: string): string {
  // Demo rows reference the sample photos bundled in /public directly, since
  // a SQL seed cannot upload files to Storage. Real uploads are bare paths.
  if (path.startsWith("/")) return path;
  return `${base}/storage/v1/object/public/listing-photos/${path}`;
}

function toListing(row: ListingRow, photos: string[]): Listing {
  return {
    id: row.id,
    title: row.title,
    priceUsd: row.price_usd,
    categoryId: row.category_id,
    zoneId: row.zone_id,
    condition: row.condition,
    status: row.status,
    description: row.description ?? "",
    // A listing with no photo would render an empty card; the placeholder
    // keeps the grid intact if one ever slips through.
    photos: photos.length > 0 ? photos : ["/samples/paperbacks-1.jpg"],
    sellerId: row.seller_id,
    postedAt: row.created_at,
    savedCount: row.saved_count,
    accent: row.accent,
  };
}

export function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: p.name,
    avatarSeed: p.id,
    zoneId: p.zone_id,
    joinedAt: p.created_at,
    emailVerified: p.email_verified,
    phoneVerified: p.phone_verified,
    neighborVerified: p.neighbor_verified,
    rating: Number(p.rating ?? 0),
    reviewCount: p.review_count ?? 0,
    karma: p.karma ?? 0,
    givenAway: p.given_away ?? 0,
    responseMinutes: 0,
    bio: p.bio ?? "",
  };
}

/**
 * Photos are fetched in a second query rather than as a join.
 *
 * The join would be one round trip, but these database types are written by
 * hand and do not declare the relationship between listings and
 * listing_photos, so Supabase cannot type the result. Two plain queries are
 * still only two round trips for any number of listings, and they are far
 * easier to read.
 */
async function photosFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingIds: string[],
  base: string,
): Promise<Map<string, string[]>> {
  const byListing = new Map<string, string[]>();
  if (listingIds.length === 0) return byListing;

  const { data } = await supabase
    .from("listing_photos")
    .select("listing_id, storage_path, position")
    .in("listing_id", listingIds)
    .order("position", { ascending: true });

  for (const row of data ?? []) {
    const list = byListing.get(row.listing_id) ?? [];
    list.push(publicUrl(base, row.storage_path));
    byListing.set(row.listing_id, list);
  }
  return byListing;
}

/** Every listing on offer, newest first. Empty when Supabase isn't set up. */
export async function fetchListings(): Promise<Listing[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .in("status", ["available", "pending"])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const photos = await photosFor(supabase, data.map((r) => r.id), base);
  return data.map((r) => toListing(r, photos.get(r.id) ?? []));
}

/**
 * Everything one neighbour currently has on offer — their storefront.
 *
 * Queried by seller rather than filtering the whole listings feed, so this
 * stays fast as the community grows and returns their full catalogue instead
 * of whatever happened to fall inside the browse limit.
 */
export async function fetchSellerListings(sellerId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured()) return [];
  if (!/^[0-9a-f-]{36}$/i.test(sellerId)) return [];

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .in("status", ["available", "pending"])
    .order("created_at", { ascending: false });

  if (!data) return [];
  const photos = await photosFor(supabase, data.map((r) => r.id), base);
  return data.map((r) => toListing(r, photos.get(r.id) ?? []));
}

/** One listing plus its seller and their other items. */
export async function fetchListing(id: string): Promise<{
  listing: Listing;
  seller: User;
  alsoFrom: Listing[];
} | null> {
  if (!isSupabaseConfigured()) return null;

  // Sample ids are "l1".."l31"; a real one is a UUID. Skip the query for the
  // samples rather than sending Postgres a malformed uuid.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const { data: row } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!row) return null;
  const ownPhotos = await photosFor(supabase, [row.id], base);
  const listing = toListing(row, ownPhotos.get(row.id) ?? []);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", listing.sellerId)
    .maybeSingle();

  const { data: others } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", listing.sellerId)
    .neq("id", id)
    .eq("status", "available")
    .limit(4);

  const otherPhotos = await photosFor(
    supabase,
    (others ?? []).map((r) => r.id),
    base,
  );

  return {
    listing,
    seller: profile
      ? profileToUser(profile)
      : {
          id: listing.sellerId,
          name: "Neighbor",
          avatarSeed: listing.sellerId,
          zoneId: listing.zoneId,
          joinedAt: listing.postedAt,
          emailVerified: false,
          phoneVerified: false,
          neighborVerified: false,
          rating: 0,
          reviewCount: 0,
          karma: 0,
          givenAway: 0,
          responseMinutes: 0,
          bio: "",
        },
    alsoFrom: (others ?? []).map((r) =>
      toListing(r, otherPhotos.get(r.id) ?? []),
    ),
  };
}
