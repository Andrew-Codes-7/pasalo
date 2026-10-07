import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchListing } from "@/lib/fetchListings";
import { SampleMessagesView } from "@/components/SampleMessagesView";
import { BottomNav } from "@/components/BottomNav";

/**
 * The inbox.
 *
 * Falls back to the sample threads only when Supabase isn't configured. Once
 * it is, this shows real conversations — otherwise starting a chat would work
 * but the thread would be unreachable from anywhere.
 */
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  if (!isSupabaseConfigured()) return <SampleMessagesView />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <SampleMessagesView />;

  // Row Level Security already limits this to threads you're part of.
  const { data: convos } = await supabase
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = await Promise.all(
    (convos ?? []).map(async (c) => {
      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const [bundle, { data: other }, { data: last }] = await Promise.all([
        fetchListing(c.listing_id),
        supabase.from("profiles").select("name").eq("id", otherId).maybeSingle(),
        supabase
          .from("messages")
          .select("body, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      return { c, bundle, otherName: other?.name ?? "Neighbor", last: last?.[0] };
    }),
  );

  const usable = rows.filter((r) => r.bundle);

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 px-4 py-4 backdrop-blur-xl">
        <h1 className="text-[22px] font-bold tracking-tight text-content">
          Messages
        </h1>
        <p className="mt-0.5 text-sm text-content-muted">
          {usable.length === 0
            ? "No conversations yet"
            : `${usable.length} conversation${usable.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {usable.length === 0 ? (
        <div className="mx-4 mt-6 rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-semibold text-content">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-content-muted">
            Open a listing and tap Message to start a conversation.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-btn px-5 py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {usable.map(({ c, bundle, otherName, last }) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2"
              >
                <Image
                  src={bundle!.listing.photos[0]}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-content">
                    {otherName}
                  </p>
                  <p className="truncate text-[13px] text-content-muted">
                    {bundle!.listing.title}
                  </p>
                  <p className="mt-1 truncate text-[14px] text-content-muted">
                    {last?.body ?? "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BottomNav />
    </div>
  );
}
