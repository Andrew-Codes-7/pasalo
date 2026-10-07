import { notFound } from "next/navigation";
import { CONVERSATIONS, listingById, userById } from "@/lib/data";
import { Thread } from "@/components/Thread";
import { RealThread } from "@/components/RealThread";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchListing } from "@/lib/fetchListings";
import { profileToUser } from "@/lib/fetchListings";

/**
 * A thread is either a real conversation or one of the sample ones.
 *
 * Real ids are UUIDs; samples are "c1".."c4". Only participants can load a
 * real thread — and that is enforced by the database, not by this check: the
 * conversation query simply returns nothing for anyone else.
 */
export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: PageProps<"/messages/[id]">) {
  const { id } = await params;

  if (isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(id)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: convo } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!convo) notFound();

    const otherId =
      convo.buyer_id === user.id ? convo.seller_id : convo.buyer_id;

    const [listingBundle, { data: otherProfile }, { data: messages }, { data: offers }] =
      await Promise.all([
        fetchListing(convo.listing_id),
        supabase.from("profiles").select("*").eq("id", otherId).maybeSingle(),
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("offers")
          .select("*")
          .eq("conversation_id", id)
          .order("created_at", { ascending: false }),
      ]);

    if (!listingBundle || !otherProfile) notFound();

    return (
      <RealThread
        conversationId={id}
        listing={listingBundle.listing}
        other={profileToUser(otherProfile)}
        meId={user.id}
        sellerId={convo.seller_id}
        initialMessages={messages ?? []}
        initialOffer={offers?.[0] ?? null}
      />
    );
  }

  const convo = CONVERSATIONS.find((c) => c.id === id);
  if (!convo) notFound();
  const listing = listingById(convo.listingId);
  if (!listing) notFound();

  return (
    <Thread
      conversation={convo}
      listing={listing}
      other={userById(convo.withUserId)}
    />
  );
}
