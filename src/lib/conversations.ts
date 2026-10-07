"use client";

import { createClient } from "./supabase/client";

/**
 * Starting or resuming a conversation about a listing.
 *
 * There is one thread per buyer per listing — the database enforces that with
 * a unique constraint — so "message the seller" twice must land in the same
 * place rather than creating a second thread. This looks for an existing one
 * first and only creates when there isn't one.
 */

export type StartResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string };

export async function startConversation(
  listingId: string,
  sellerId: string,
): Promise<StartResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in to message." };

  if (user.id === sellerId) {
    return { ok: false, error: "This is your own listing." };
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) return { ok: true, conversationId: existing.id };

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select("id")
    .single();

  if (error || !created) {
    // A duplicate here means someone double-tapped and the unique constraint
    // did its job; fetch the row that won instead of showing an error.
    if (error?.code === "23505") {
      const { data: raced } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (raced) return { ok: true, conversationId: raced.id };
    }
    return { ok: false, error: error?.message ?? "Could not start the chat." };
  }

  return { ok: true, conversationId: created.id };
}

/** Send a message into an existing thread. */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: body.trim(),
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Send an offer. Offers are their own object, not a chat message. */
export async function sendOffer(
  conversationId: string,
  listingId: string,
  sellerId: string,
  amountUsd: number,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("offers").insert({
    conversation_id: conversationId,
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: sellerId,
    amount_usd: amountUsd,
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}
