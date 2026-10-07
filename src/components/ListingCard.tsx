"use client";

import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { priceLabel, userById, zoneById } from "@/lib/data";
import { Icon } from "./Icon";
import { SaveButton } from "./SaveButton";
import { useApp } from "./Providers";

/**
 * The card the browse grid is built from: photo fills the tile, a tinted
 * scrim rises from the bottom, and the text sits on top of it. The scrim runs
 * neutral-dark first and the listing tint second — the tint alone fails on
 * pale photos.
 */
export function ListingCard({
  listing,
  priority = false,
}: {
  listing: Listing;
  priority?: boolean;
}) {
  const { t } = useApp();
  const seller = userById(listing.sellerId);
  const zone = zoneById(listing.zoneId);
  const isFree = listing.priceUsd === null;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <Image
        src={listing.photos[0]}
        alt={listing.title}
        fill
        sizes="(min-width: 1280px) 260px, (min-width: 640px) 30vw, 50vw"
        priority={priority}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]">
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 45%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 45%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/32 to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${listing.accent}bb 12%, ${listing.accent}70 45%, ${listing.accent}00 100%)`,
          }}
        />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
        <span
          className={[
            "rounded-full px-3 py-1.5 text-sm font-bold backdrop-blur-md",
            isFree ? "bg-brand-500 text-brand-900" : "bg-black/35 text-white",
          ].join(" ")}
        >
          {priceLabel(listing.priceUsd, t("free"))}
        </span>
        <SaveButton label={listing.title} />
      </div>

      {listing.status === "pending" && (
        <span className="absolute left-2.5 top-14 rounded-full bg-flag-500/95 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {t("salePending")}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight drop-shadow-sm">
          {listing.title}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-[13px] text-white/85">
          <Icon name="pin" size={13} />
          <span className="truncate">
            {zone.label}
            {zone.minutesFromCenter > 0 && ` · ${zone.minutesFromCenter} min`}
          </span>
        </p>

        <div className="mt-2.5 flex items-center gap-1.5">
          {seller.reviewCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon name="star-filled" size={12} />
              {seller.rating.toFixed(1)}
            </span>
          )}
          {seller.neighborVerified && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon name="shield" size={12} />
              {t("verified")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
