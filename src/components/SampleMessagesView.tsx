"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CONVERSATIONS,
  listingById,
  priceLabel,
  timeAgo,
  userById,
} from "@/lib/data";
import { Avatar } from "./Avatar";
import { BottomNav } from "./BottomNav";
import { Icon } from "./Icon";
import { useApp } from "./Providers";

export function SampleMessagesView() {
  const { t } = useApp();
  const unreadTotal = CONVERSATIONS.reduce((n, c) => n + c.unread, 0);

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 px-4 py-4 backdrop-blur-xl">
        <h1 className="text-[22px] font-bold tracking-tight text-content">
          {t("messages")}
        </h1>
        <p className="mt-0.5 text-sm text-content-muted">
          {unreadTotal > 0
            ? t("unreadCount", { n: unreadTotal })
            : t("allCaughtUp")}
        </p>
      </header>

      <ul className="divide-y divide-line">
        {CONVERSATIONS.map((c) => {
          const listing = listingById(c.listingId);
          const other = userById(c.withUserId);
          if (!listing) return null;

          return (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500"
              >
                <div className="relative shrink-0">
                  <Image
                    src={listing.photos[0]}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1">
                    <Avatar user={other} size={24} />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold text-content">
                      {other.name}
                    </p>
                    <span className="shrink-0 text-xs text-content-faint">
                      {timeAgo(c.lastAt)}
                    </span>
                  </div>

                  <p className="truncate text-[13px] text-content-muted">
                    {listing.title} · {priceLabel(listing.priceUsd, t("free"))}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <p
                      className={[
                        "min-w-0 flex-1 truncate text-[14px]",
                        c.unread > 0
                          ? "font-medium text-content"
                          : "text-content-muted",
                      ].join(" ")}
                    >
                      {c.lastMessage}
                    </p>
                    {c.unread > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-btn px-1.5 text-[11px] font-bold text-btn-fg">
                        {c.unread}
                      </span>
                    )}
                  </div>

                  {c.offerStatus === "pending" && c.offerUsd && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-flag-500/12 px-2 py-0.5 text-[11px] font-semibold text-flag-500 dark:text-flag-400">
                      <Icon name="clock" size={11} />
                      {t("offerAwaiting", { price: `$${c.offerUsd}` })}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <BottomNav />
    </div>
  );
}
