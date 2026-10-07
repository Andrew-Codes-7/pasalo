"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Conversation, Listing, User } from "@/lib/types";
import { priceLabel } from "@/lib/data";
import { Avatar } from "./Avatar";
import { BackBar } from "./BackBar";
import { Icon } from "./Icon";
import { useApp } from "./Providers";

type Bubble = { id: string; from: "me" | "them"; text: string; at: string };

const SAMPLE: Bubble[] = [
  { id: "m1", from: "me", text: "Hi! Is this still available?", at: "8:41 AM" },
  {
    id: "m2",
    from: "them",
    text: "It is. Happy to show it to you — I'm at the beach most mornings.",
    at: "8:52 AM",
  },
  {
    id: "m3",
    from: "me",
    text: "Great. How bad are the dings honestly? I'm a beginner so I don't mind cosmetic stuff.",
    at: "9:02 AM",
  },
  {
    id: "m4",
    from: "them",
    text: "Purely cosmetic, both sealed properly. It'll take a beating.",
    at: "9:08 AM",
  },
];

/**
 * The thread is where a trade gets agreed, so the offer lives here as its own
 * card rather than as plain text. Accepting flips the listing to pending and,
 * once exchanged, unlocks a review — reviews are anchored to a real completed
 * trade so they cannot be farmed.
 */
export function Thread({
  conversation,
  listing,
  other,
}: {
  conversation: Conversation;
  listing: Listing;
  other: User;
}) {
  const { t } = useApp();
  const [offerStatus, setOfferStatus] = useState(conversation.offerStatus);
  const [exchanged, setExchanged] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Bubble[]>(SAMPLE);

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { id: `m${m.length + 1}`, from: "me", text, at: "now" },
    ]);
    setDraft("");
  }

  const offerPrice = conversation.offerUsd ? `$${conversation.offerUsd}` : "";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <BackBar
        title={other.name}
        action={<Avatar user={other} size={32} showVerified />}
      />

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

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.from === "me" ? "flex justify-end" : "flex"}
          >
            <div
              className={[
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug",
                m.from === "me"
                  ? "rounded-br-md bg-btn text-btn-fg"
                  : "rounded-bl-md bg-surface-2 text-content",
              ].join(" ")}
            >
              {m.text}
              <span
                className={[
                  "mt-1 block text-[11px]",
                  m.from === "me" ? "opacity-70" : "text-content-faint",
                ].join(" ")}
              >
                {m.at}
              </span>
            </div>
          </div>
        ))}

        {conversation.offerUsd && (
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
                  {offerPrice}
                </p>
              </div>
              {offerStatus === "accepted" && (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-on-soft">
                  {t("accepted")}
                </span>
              )}
              {offerStatus === "declined" && (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-content-muted">
                  {t("declined")}
                </span>
              )}
            </div>

            {offerStatus === "pending" && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOfferStatus("declined")}
                  className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-content-muted transition hover:bg-surface-2"
                >
                  {t("decline")}
                </button>
                <button
                  type="button"
                  onClick={() => setOfferStatus("accepted")}
                  className="flex-[2] rounded-full bg-btn py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
                >
                  {t("accept", { price: offerPrice })}
                </button>
              </div>
            )}

            {offerStatus === "accepted" && !exchanged && (
              <button
                type="button"
                onClick={() => setExchanged(true)}
                className="mt-3 w-full rounded-full bg-surface-inverse py-2.5 text-sm font-semibold text-surface transition hover:opacity-90"
              >
                {t("markAsExchanged")}
              </button>
            )}

            {exchanged && (
              <div className="mt-3 rounded-2xl bg-accent-soft p-3 text-center">
                <p className="text-sm font-semibold text-accent-on-soft">
                  {t("tradeComplete")}
                </p>
                <p className="mt-0.5 text-[13px] text-accent-on-soft/80">
                  {t("tradeCompleteBody", { name: other.name.split(" ")[0] })}
                </p>
                <button
                  type="button"
                  className="mt-2.5 w-full rounded-full bg-btn py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
                >
                  {t("leaveReview")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
            disabled={!draft.trim()}
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
