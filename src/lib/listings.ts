"use client";

import { createClient } from "./supabase/client";
import type { ListingCondition } from "./supabase/types";

/**
 * Saving a new listing.
 *
 * Two tables are involved: one row in `listings`, then one row per photo in
 * `listing_photos`. They are written in that order because a photo row needs
 * the listing's id, which the database generates.
 *
 * Note what is NOT sent: seller_id is taken from the signed-in session rather
 * than the form, and karma is never mentioned. Posting awards karma through a
 * database trigger, so the app cannot inflate it even by accident.
 */

export type NewListing = {
  title: string;
  description: string;
  priceUsd: number | null;
  categoryId: string;
  zoneId: string;
  condition: ListingCondition;
  accent: string;
  photoPaths: string[];
};

export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createListing(input: NewListing): Promise<CreateResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to post." };
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      price_usd: input.priceUsd,
      category_id: input.categoryId,
      zone_id: input.zoneId,
      condition: input.condition,
      accent: input.accent,
    })
    .select("id")
    .single();

  if (error || !listing) {
    return { ok: false, error: friendlyError(error?.message ?? "Unknown error") };
  }

  if (input.photoPaths.length > 0) {
    const { error: photoError } = await supabase.from("listing_photos").insert(
      input.photoPaths.map((storage_path, position) => ({
        listing_id: listing.id,
        storage_path,
        position,
      })),
    );
    if (photoError) {
      return {
        ok: false,
        error: "The listing saved but its photos did not. Try editing it.",
      };
    }
  }

  return { ok: true, id: listing.id };
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("violates row-level")) {
    return "The database refused that. Make sure you're signed in.";
  }
  if (m.includes("check constraint") && m.includes("title")) {
    return "Titles need to be between 3 and 70 characters.";
  }
  if (m.includes("check constraint") && m.includes("price")) {
    return "That price is out of range.";
  }
  return message;
}
