import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { BulletinRow, EventRow, ServiceRow } from "./supabase/types";

/**
 * Reads for the three new sections.
 *
 * Each returns an empty array rather than throwing when Supabase is asleep or
 * unconfigured — a quiet section is a normal state for this app, and a home
 * page that crashes because nobody has posted a meetup yet would be worse than
 * one that simply says so.
 */

export type BulletinPost = BulletinRow & { authorName: string };
export type CommunityEvent = EventRow & {
  hostName: string;
  goingCount: number;
  /** Null when you have not responded. */
  myRsvp: "going" | "maybe" | null;
};
export type ServiceEntry = ServiceRow;

async function nameMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", Array.from(new Set(ids)));
  for (const p of data ?? []) map.set(p.id, p.name);
  return map;
}

/** Newest bulletin posts, pinned first, expired ones dropped. */
export async function fetchBulletin(limit = 20): Promise<BulletinPost[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("bulletin_posts")
    .select("*")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  const names = await nameMap(supabase, data.map((p) => p.author_id));
  return data.map((p) => ({
    ...p,
    authorName: names.get(p.author_id) ?? "Neighbor",
  }));
}

/** Meetups still to come, soonest first. */
export async function fetchUpcomingEvents(limit = 20): Promise<CommunityEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("cancelled", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (!data) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [names, { data: rsvps }] = await Promise.all([
    nameMap(supabase, data.map((e) => e.host_id)),
    supabase
      .from("event_rsvps")
      .select("event_id, user_id, status, guest_count")
      .in("event_id", data.map((e) => e.id)),
  ]);

  const going = new Map<string, number>();
  const mine = new Map<string, "going" | "maybe">();
  for (const r of rsvps ?? []) {
    if (r.status === "going") {
      // One RSVP is one person plus whoever they're bringing.
      going.set(r.event_id, (going.get(r.event_id) ?? 0) + 1 + r.guest_count);
    }
    if (user && r.user_id === user.id) mine.set(r.event_id, r.status);
  }

  return data.map((e) => ({
    ...e,
    hostName: names.get(e.host_id) ?? "Neighbor",
    goingCount: going.get(e.id) ?? 0,
    myRsvp: mine.get(e.id) ?? null,
  }));
}

/** Active service listings, best-rated first. */
export async function fetchServices(limit = 50): Promise<ServiceEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
