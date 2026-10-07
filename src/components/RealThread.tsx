"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Listing, User } from "@/lib/types";
import type { MessageRow, OfferRow } from "@/lib/supabase/types";
import { priceLabel } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/conversations";
import { Avatar } from "./Avatar";
import { BackBar } from "./BackBar";
import { Icon } from "./Icon";
import { useApp } from "./Providers";

/**
 * A real conversation, backed by the database.
 *
 * Messages arrive live through Supabase Realtime rather than by polling, so a
 * reply appears without either person refreshing. The subscription is scoped
 * to this conversation, and Row Level Security means a subscription to someone
 * else's thread would simply deliver nothing.
 */
export function RealThread({
  conversationId,
  listing,
  other,
  meId,
  sellerId,
  initialMessages,
  initialOffer,
}: {
  conversationId: string;
  listing: Listing;
  other: User;
  meId: string;
  sellerId: string;
  initialMessages: MessageRow[];
  initialOffer: OfferRow | null;
}) {
  const { t } = useApp();
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [offer, setOffer] = useState<OfferRow | null>(initialOffer);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const iAmSeller = meId === sellerId;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          // Skip our own — it is already on screen from the optimistic add.
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => setOffer(payload.new as OfferRow),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    const result = await sendMessage(conversationId, body);
    if (!result.ok) {
      setError(result.error ?? "Could not send.");
      setDraft(body);
    }
    setSending(false);
  }

  async function respondToOffer(status: "accepted" | "declined") {
    if (!offer) return;
    const supabase = createClient();
    const { error: err } = await supabase
      .from("offers")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", offer.id);
    if (err) setError(err.message);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <BackBar title={other.name} action={<Avatar user={other} size={32} showVerified />} />

      <Link
        href={`/listing/${listing.id}`}
        className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5 transition hover:bg-surface-3"
      >
        <Image
          src={listing.photos[0]}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-content">
            {listing.title}
          </p>
          <p className="text-[12px] text-content-muted">
            {priceLabel(listing.priceUsd, t("free"))}
          </p>
        </div>
        <Icon name="chevron-right" size={16} className="text-content-faint" />
      </Link>

      <div className="flex-1 space-y-3 px-4 py-4">
        <p className="mx-auto max-w-sm rounded-xl bg-surface-2 px-3 py-2 text-center text-[12px] leading-snug text-content-muted">
          {t("keepMessagesHere")}
        </p>

        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-content-muted">
            Say hello — ask if it&apos;s still available.
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex"}>
              <div
                className={[
                  "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug",
                  mine
                    ? "rounded-br-md bg-btn text-btn-fg"
                    : "rounded-bl-md bg-surface-2 text-content",
                ].join(" ")}
              >
                {m.body}
                <span
                  className={[
                    "mt-1 block text-[11px]",
                    mine ? "opacity-70" : "text-content-faint",
                  ].join(" ")}
                >
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {offer && (
          <div className="mx-auto w-full max-w-sm rounded-card border border-line p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
                <Icon name="spark" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-content-muted">
                  {t("offerReceived")}
                </p>
                <p className="text-lg font-bold leading-tight text-content">
                  ${offer.amount_usd}
                </p>
              </div>
              {offer.status !== "pending" && (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-content-muted">
                  {offer.status === "accepted" ? t("accepted") : t("declined")}
                </span>
              )}
            </div>

            {offer.status === "pending" && iAmSeller && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => respondToOffer("declined")}
                  className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-content-muted transition hover:bg-surface-2"
                >
                  {t("decline")}
                </button>
                <button
                  type="button"
                  onClick={() => respondToOffer("accepted")}
                  className="flex-[2] rounded-full bg-btn py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
                >
                  {t("accept", { price: `$${offer.amount_usd}` })}
                </button>
              </div>
            )}

            {offer.status === "pending" && !iAmSeller && (
              <p className="mt-2 text-[13px] text-content-muted">
                Waiting for {other.name.split(" ")[0]} to respond.
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-[13px] text-danger-500 dark:text-danger-400">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <label htmlFor="composer" className="sr-only">
            {t("writeMessage")}
          </label>
          <input
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("writeMessage")}
            className="min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-4 py-3 text-[15px] text-content placeholder:text-content-faint focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            aria-label={t("send")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-btn text-btn-fg transition hover:bg-btn-hover disabled:opacity-30"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
