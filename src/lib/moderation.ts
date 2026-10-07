"use client";

import { createClient } from "./supabase/client";

/**
 * Approving and rejecting submissions.
 *
 * These are plain updates to the status column — the database decides whether
 * they are allowed. A non-moderator calling this has their change silently
 * reverted by the guard trigger rather than erroring, so the UI is never the
 * thing standing between someone and approving their own post.
 */

export type Kind = "services" | "events" | "bulletin_posts";

export async function moderate(
  kind: Kind,
  id: string,
  approve: boolean,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from(kind)
    .update({
      status: approve ? "approved" : "rejected",
      rejection_note: approve ? null : (note?.trim() || null),
    })
    .eq("id", id);

  return error ? { ok: false, error: error.message } : { ok: true };
}
