"use client";

import { createClient } from "./supabase/client";
import type { BulletinRow, EventRow } from "./supabase/types";

/**
 * Writes for the three community sections.
 *
 * Each follows the same shape as listings: the signed-in user is taken from
 * the session rather than the form, and karma is never mentioned — the
 * database awards it through triggers, so the app cannot inflate it.
 */

export type Result<T = void> =
  | ({ ok: true } & (T extends void ? object : { id: string }))
  | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("violates row-level")) {
    return "The database refused that. You may not have permission yet.";
  }
  if (m.includes("check constraint")) {
    return "One of those fields is too long or too short.";
  }
  return message;
}

// ---------------------------------------------------------------------------

export async function createService(input: {
  name: string;
  categoryId: string;
  description: string;
  rateNote: string;
  phone: string;
  whatsapp: string;
  zones: string[];
  isMine: boolean;
}): Promise<Result<string>> {
  const supabase = createClient();
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("services")
    .insert({
      created_by: uid,
      // Only claim it as yours if you said so. Listing the AC guy on his
      // behalf must not make you the provider.
      provider_id: input.isMine ? uid : null,
      name: input.name.trim(),
      category_id: input.categoryId,
      description: input.description.trim() || null,
      rate_note: input.rateNote.trim() || null,
      phone: input.phone.trim() || null,
      whatsapp: input.whatsapp.trim() || null,
      zones: input.zones,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: friendly(error?.message ?? "Could not save.") };
  }
  return { ok: true, id: data.id };
}

export async function createBulletinPost(input: {
  title: string;
  body: string;
  kind: BulletinRow["kind"];
  zoneId: string | null;
  expiresInDays: number | null;
}): Promise<Result<string>> {
  const supabase = createClient();
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "You need to be signed in." };

  const expires =
    input.expiresInDays === null
      ? null
      : new Date(
          Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000,
        ).toISOString();

  const { data, error } = await supabase
    .from("bulletin_posts")
    .insert({
      author_id: uid,
      title: input.title.trim(),
      body: input.body.trim(),
      kind: input.kind,
      zone_id: input.zoneId,
      expires_at: expires,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: friendly(error?.message ?? "Could not post.") };
  }
  return { ok: true, id: data.id };
}

export async function createEvent(input: {
  title: string;
  description: string;
  kind: EventRow["kind"];
  startsAt: string;
  zoneId: string;
  locationNote: string;
  capacity: number | null;
}): Promise<Result<string>> {
  const supabase = createClient();
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: uid,
      title: input.title.trim(),
      description: input.description.trim() || null,
      kind: input.kind,
      starts_at: new Date(input.startsAt).toISOString(),
      zone_id: input.zoneId,
      location_note: input.locationNote.trim() || null,
      capacity: input.capacity,
    })
    .select("id")
    .single();

  if (error || !data) {
    // The database gates hosting on karma, so this is the likely refusal.
    const msg = error?.message ?? "";
    if (msg.toLowerCase().includes("row-level security")) {
      return {
        ok: false,
        error: "Hosting meetups unlocks at 200 karma.",
      };
    }
    return { ok: false, error: friendly(msg || "Could not create.") };
  }
  return { ok: true, id: data.id };
}
