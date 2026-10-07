import { notFound } from "next/navigation";
import { USERS } from "@/lib/data";
import { ProfileView } from "@/components/ProfileView";
import { createClient } from "@/lib/supabase/server";
import { fetchSellerListings } from "@/lib/fetchListings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { User } from "@/lib/types";

/**
 * A profile is either a real account or one of the sample neighbours the
 * browse screens still use.
 *
 * Real account ids are UUIDs; the samples are "u1".."u6". This page previously
 * only knew the samples and pre-rendered exactly those, so opening your own
 * profile from the account menu 404'd — the id was a UUID matching nothing.
 */

/** Real profiles are looked up per request rather than pre-built. */
export const dynamic = "force-dynamic";

async function realUser(id: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  // Map the database row onto the shape the view already understands.
  return {
    id: data.id,
    name: data.name,
    avatarSeed: data.id,
    zoneId: data.zone_id,
    joinedAt: data.created_at,
    emailVerified: data.email_verified,
    phoneVerified: data.phone_verified,
    neighborVerified: data.neighbor_verified,
    rating: Number(data.rating ?? 0),
    reviewCount: data.review_count ?? 0,
    karma: data.karma ?? 0,
    givenAway: data.given_away ?? 0,
    responseMinutes: 0,
    bio: data.bio ?? "",
  };
}

export default async function ProfilePage({
  params,
}: PageProps<"/profile/[id]">) {
  const { id } = await params;

  // Who is looking decides what this page is: your own account, or someone
  // else's storefront.
  let viewerId: string | undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();
    viewerId = viewer?.id;
  }

  const sample = USERS.find((u) => u.id === id);
  if (sample) return <ProfileView user={sample} viewerId={viewerId} />;

  const user = await realUser(id);
  if (!user) notFound();

  // Queried by seller rather than filtering the whole feed, so a prolific
  // neighbour's full catalogue shows rather than whatever fell inside the
  // browse limit.
  const theirs = await fetchSellerListings(id);

  return <ProfileView user={user} listings={theirs} viewerId={viewerId} />;
}
