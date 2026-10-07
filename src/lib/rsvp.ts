"use client";

import { createClient } from "./supabase/client";

/**
 * Going / not going.
 *
 * Upserted rather than inserted because the primary key is (event, person) —
 * tapping twice must change your answer, not fail on a duplicate.
 */
export async function setRsvp(
  eventId: string,
  status: "going" | "maybe" | null,
  guestCount = 0,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  if (status === null) {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, user_id: user.id, status, guest_count: guestCount },
      { onConflict: "event_id,user_id" },
    );

  return error ? { ok: false, error: error.message } : { ok: true };
}
