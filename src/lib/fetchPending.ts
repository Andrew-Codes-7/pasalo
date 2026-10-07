import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { BulletinRow, EventRow, ServiceRow } from "./supabase/types";

export type PendingQueue = {
  isModerator: boolean;
  services: (ServiceRow & { authorName: string })[];
  events: (EventRow & { authorName: string })[];
  bulletin: (BulletinRow & { authorName: string })[];
};

const EMPTY: PendingQueue = {
  isModerator: false,
  services: [],
  events: [],
  bulletin: [],
};

/**
 * Everything waiting for review.
 *
 * Row Level Security already limits pending rows to their author and to
 * moderators, so a non-moderator calling this simply gets their own
 * submissions back rather than the whole queue.
 */
export async function fetchPending(): Promise<PendingQueue> {
  if (!isSupabaseConfigured()) return EMPTY;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: me } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", user.id)
    .maybeSingle();

  const [{ data: services }, { data: events }, { data: bulletin }] =
    await Promise.all([
      supabase.from("services").select("*").eq("status", "pending"),
      supabase.from("events").select("*").eq("status", "pending"),
      supabase.from("bulletin_posts").select("*").eq("status", "pending"),
    ]);

  const ids = [
    ...(services ?? []).map((s) => s.created_by),
    ...(events ?? []).map((e) => e.host_id),
    ...(bulletin ?? []).map((b) => b.author_id),
  ];

  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", Array.from(new Set(ids)));
    for (const p of data ?? []) names.set(p.id, p.name);
  }

  const who = (id: string) => names.get(id) ?? "Neighbor";

  return {
    isModerator: Boolean(me?.is_moderator),
    services: (services ?? []).map((s) => ({ ...s, authorName: who(s.created_by) })),
    events: (events ?? []).map((e) => ({ ...e, authorName: who(e.host_id) })),
    bulletin: (bulletin ?? []).map((b) => ({ ...b, authorName: who(b.author_id) })),
  };
}
