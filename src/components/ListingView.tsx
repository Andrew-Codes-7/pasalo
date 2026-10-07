"use client";

import Link from "next/link";
import type { Listing, User } from "@/lib/types";
import type { StringKey } from "@/lib/i18n";
import { categoryById, timeAgo, userById, zoneById } from "@/lib/data";
import { Avatar } from "./Avatar";
import { BackBar } from "./BackBar";
import { Gallery } from "./Gallery";
import { Icon } from "./Icon";
import { ListingActions } from "./ListingActions";
import { ListingCard } from "./ListingCard";
import { SaveButton } from "./SaveButton";
import { SectionHeader } from "./SectionHeader";
import { useApp } from "./Providers";

const CONDITION_KEYS: Record<string, StringKey> = {
  new: "condNew",
  "like-new": "condLikeNew",
  good: "condGood",
  fair: "condFair",
  "for-parts": "condForParts",
};

export function ListingView({
  listing,
  seller: sellerProp,
  alsoFrom = [],
}: {
  listing: Listing;
  /** Real listings pass the seller in; sample ones fall back to lib/data. */
  seller?: User;
  alsoFrom?: Listing[];
}) {
  const { t, lang } = useApp();
  const seller = sellerProp ?? userById(listing.sellerId);
  const zone = zoneById(listing.zoneId);
  const category = categoryById(listing.categoryId);

  return (
    /**
     * Two layouts, because marketplaces genuinely use two.
     *
     * Phones get the full-bleed photo with floating back/save buttons and no
     * site header — the pattern OfferUp and Facebook Marketplace both use.
     *
     * Desktop keeps the site header and puts the photo in a contained column
     * beside the details, because a full-bleed photo pinned to the top of a
     * 1400px monitor with no navigation reads as a broken page.
     */
    <div className="pb-32 lg:pb-16">
      <div className="hidden lg:block">
        <SectionHeader titleKey="exchangeTitle" subKey="exchangeSub" />
      </div>

      <div className="mx-auto w-full max-w-2xl lg:max-w-6xl lg:px-6 lg:pt-6">
        <Link
          href="/"
          className="mb-4 hidden items-center gap-1.5 text-sm font-medium text-content-muted transition hover:text-content lg:inline-flex"
        >
          <Icon name="arrow-left" size={16} />
          {t("browse")}
        </Link>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="relative lg:overflow-hidden lg:rounded-card lg:border lg:border-line">
            <Gallery photos={listing.photos} alt={listing.title} />
            {/* Floating controls are the phone pattern; on desktop the header
                and the back link above do that job. */}
            <div className="lg:hidden">
              <BackBar overlay action={<SaveButton label={listing.title} />} />
            </div>
          </div>

          <div className="px-4 lg:px-0">
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-content-muted">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
            {lang === "es" ? category.labelEs : category.label}
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
            {t(CONDITION_KEYS[listing.condition])}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="clock" size={13} />
            {timeAgo(listing.postedAt)}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-content">
          {listing.title}
        </h1>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-content-muted">
          <Icon name="pin" size={15} />
          {zone.label} ·{" "}
          {zone.minutesFromCenter > 0
            ? t("minFromCoco", { n: zone.minutesFromCenter })
            : t("inTown")}
        </p>

        <ListingActions
          listingTitle={listing.title}
          priceUsd={listing.priceUsd}
          sellerName={seller.name.split(" ")[0]}
          listingId={listing.id}
          sellerId={seller.id}
        />

        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-content">
          {listing.description}
        </p>

        <p className="mt-4 text-[13px] text-content-faint">
          {t("peopleSaved", { n: listing.savedCount })}
        </p>

        {/* Seller trust panel — the reason someone feels safe replying */}
        <section className="mt-6 rounded-card border border-line p-4">
          <Link
            href={`/profile/${seller.id}`}
            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <Avatar user={seller} size={48} showVerified />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-content">
                {seller.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-content-muted">
                {seller.reviewCount > 0 ? (
                  <>
                    <Icon
                      name="star-filled"
                      size={13}
                      className="text-brand-500"
                    />
                    {seller.rating.toFixed(1)} ·{" "}
                    {t("reviewsCount", { n: seller.reviewCount })}
                  </>
                ) : (
                  t("noReviewsYet")
                )}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400">
              {t("storefront")}
              <Icon name="chevron-right" size={16} />
            </span>
          </Link>

          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <Stat label={t("karma")} value={String(seller.karma)} />
            <Stat label={t("givenAway")} value={String(seller.givenAway)} />
            <Stat
              label={t("repliesIn")}
              value={
                seller.responseMinutes > 0 ? `~${seller.responseMinutes}m` : "—"
              }
            />
          </dl>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {seller.neighborVerified && (
              <Badge icon="shield">{t("verifiedNeighbor")}</Badge>
            )}
            {seller.emailVerified && (
              <Badge icon="check">{t("emailConfirmed")}</Badge>
            )}
            {seller.phoneVerified && (
              <Badge icon="check">{t("phoneConfirmed")}</Badge>
            )}
          </div>
        </section>

        {/* Safety guidance, stated plainly rather than buried in a help page */}
        <section className="mt-4 rounded-card border border-accent-soft-line bg-accent-soft p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-accent-on-soft">
            <Icon name="shield" size={16} />
            {t("tradingSafely")}
          </h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-accent-on-soft/85">
            <li>{t("safety1")}</li>
            <li>{t("safety2")}</li>
            <li>{t("safety3")}</li>
          </ul>
        </section>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-content-muted transition hover:bg-surface-2 hover:text-content"
        >
          <Icon name="flag" size={15} />
          {t("reportListing")}
        </button>

        {alsoFrom.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-[17px] font-bold tracking-tight text-content">
                {t("alsoFrom", { name: seller.name.split(" ")[0] })}
              </h2>
              <Link
                href={`/profile/${seller.id}#storefront`}
                className="shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-400"
              >
                {t("seeAllFrom", { name: seller.name.split(" ")[0] })}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {alsoFrom.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-content-faint">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-content">{value}</dd>
    </div>
  );
}

function Badge({
  icon,
  children,
}: {
  icon: "shield" | "check";
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-on-soft">
      <Icon name={icon} size={12} strokeWidth={2.4} />
      {children}
    </span>
  );
}
