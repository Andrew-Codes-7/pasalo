"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import type { BulletinPost, CommunityEvent, ServiceEntry } from "@/lib/fetchCommunity";
import { zoneById } from "@/lib/data";
import { ListingCard } from "./ListingCard";
import { Icon } from "./Icon";
import { useApp } from "./Providers";

/**
 * Home as a digest of the whole town rather than a section of its own.
 *
 * Each row previews another tab and links through to it. This is what makes a
 * four-section app feel like one place instead of four — and it means the
 * landing screen has something on it even when any single section is quiet.
 */
export function HomeDigest({
  bulletin,
  events,
  listings,
  services,
}: {
  bulletin: BulletinPost[];
  events: CommunityEvent[];
  listings: Listing[];
  services: ServiceEntry[];
}) {
  const { t } = useApp();
  const everythingEmpty =
    !bulletin.length && !events.length && !listings.length && !services.length;

  if (everythingEmpty) {
    return (
      <div className="mt-6 rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
          <Icon name="spark" size={22} />
        </span>
        <p className="mt-3 font-semibold text-content">Nothing posted yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">
          You&apos;re first. Add a service you rely on, post something you no
          longer need, or put a notice on the bulletin.
        </p>
        <Link
          href="/post/bulletin"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-btn px-5 py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
        >
          <Icon name="plus" size={16} />
          {t("postSomething")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-9 pt-5">
      {/* ---- Bulletin ---- */}
      <Row
        title={t("bulletinTitle")}
        href="/post/bulletin"
        seeAll="Post a notice"
        empty={bulletin.length === 0}
        emptyText="No notices right now. Quiet is good."
      >
        <div className="space-y-2.5">
          {bulletin.slice(0, 3).map((p) => (
            <article
              key={p.id}
              className={[
                "rounded-card border p-4",
                p.kind === "alert"
                  ? "border-flag-500/40 bg-flag-500/5"
                  : "border-line",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 text-[12px] font-medium text-content-muted">
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    p.kind === "alert"
                      ? "bg-flag-500/15 text-flag-500 dark:text-flag-400"
                      : "bg-accent-soft text-accent-on-soft",
                  ].join(" ")}
                >
                  {KIND_LABEL[p.kind]}
                </span>
                {p.zone_id && <span>{zoneById(p.zone_id).label}</span>}
                <span className="ml-auto">{sinceLabel(p.created_at)}</span>
              </div>
              <h3 className="mt-2 font-semibold text-content">{p.title}</h3>
              <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-content-muted">
                {p.body}
              </p>
              <p className="mt-2 text-[12px] text-content-faint">
                {p.authorName}
              </p>
            </article>
          ))}
        </div>
      </Row>

      {/* ---- Meetups ---- */}
      <Row
        title={t("meetupsTitle")}
        href="/meetups"
        seeAll="All meetups"
        empty={events.length === 0}
        emptyText="Nothing on the calendar yet."
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 3).map((e) => (
            <Link
              key={e.id}
              href="/meetups"
              className="rounded-card border border-line p-4 transition hover:border-line-strong"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-bold uppercase tracking-wide text-accent-on-soft">
                  {dateLabel(e.starts_at)}
                </span>
                <span className="text-[12px] text-content-muted">
                  {timeLabel(e.starts_at)}
                </span>
              </div>
              <h3 className="mt-1.5 font-semibold text-content">{e.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-content-muted">
                <Icon name="pin" size={13} />
                {zoneById(e.zone_id).label}
              </p>
              <p className="mt-2 text-[12px] text-content-faint">
                {e.goingCount > 0
                  ? `${e.goingCount} going · hosted by ${e.hostName}`
                  : `Hosted by ${e.hostName}`}
              </p>
            </Link>
          ))}
        </div>
      </Row>

      {/* ---- Exchange ---- */}
      <Row
        title={t("exchangeTitle")}
        href="/exchange"
        seeAll="All items"
        empty={listings.length === 0}
        emptyText="Nothing up for grabs yet."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {listings.slice(0, 5).map((l, i) => (
            <ListingCard key={l.id} listing={l} priority={i < 2} />
          ))}
        </div>
      </Row>

      {/* ---- Services ---- */}
      <Row
        title={t("servicesTitle")}
        href="/services"
        seeAll="All services"
        empty={services.length === 0}
        emptyText="No providers listed yet."
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 3).map((s) => (
            <Link
              key={s.id}
              href="/services"
              className="flex items-start gap-3 rounded-card border border-line p-4 transition hover:border-line-strong"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
                <Icon name="tool" size={18} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-content">
                  {s.name}
                </span>
                <span className="mt-0.5 block text-[13px] text-content-muted">
                  {s.review_count > 0
                    ? `★ ${s.rating.toFixed(1)} · ${s.review_count} review${s.review_count === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </span>
                {s.rate_note && (
                  <span className="mt-0.5 block truncate text-[12px] text-content-faint">
                    {s.rate_note}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </Row>
    </div>
  );
}

const KIND_LABEL: Record<BulletinPost["kind"], string> = {
  alert: "Alert",
  news: "News",
  notice: "Notice",
  lost_found: "Lost & found",
  recommendation: "Recommendation",
};

function Row({
  title,
  href,
  seeAll,
  empty,
  emptyText,
  children,
}: {
  title: string;
  href: string;
  seeAll: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-tight text-content lg:text-xl">
          {title}
        </h2>
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-400"
        >
          {seeAll}
        </Link>
      </div>
      {empty ? (
        <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-[13px] text-content-muted">
          {emptyText}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function sinceLabel(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
