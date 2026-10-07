"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CommunityEvent } from "@/lib/fetchCommunity";
import { EVENT_KINDS } from "@/lib/communityData";
import { zoneById } from "@/lib/data";
import { setRsvp } from "@/lib/rsvp";
import { Icon } from "./Icon";
import { useApp } from "./Providers";
import { EmptySection } from "./EmptySection";

/**
 * Upcoming meetups.
 *
 * Grouped by day rather than listed flat: "what's on this Saturday" is the
 * question people actually arrive with, and a flat list makes them do the
 * date arithmetic themselves.
 */
export function MeetupsView({
  events,
  viewerId,
}: {
  events: CommunityEvent[];
  viewerId?: string;
}) {
  const { lang } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(e: CommunityEvent) {
    setError(null);
    setBusy(e.id);
    try {
      const result = await setRsvp(e.id, e.myRsvp === "going" ? null : "going");
      if (!result.ok) {
        setError(result.error ?? "Could not save that.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (events.length === 0) {
    return (
      <EmptySection
        icon="users"
        title="Nothing on the calendar"
        body="A swap day, a beach cleanup, a game night — anything that gets people in the same place."
        ctaLabel="Host a meetup"
        ctaHref="/post/meetup"
      />
    );
  }

  // Group by calendar day.
  const days = new Map<string, CommunityEvent[]>();
  for (const e of events) {
    const key = new Date(e.starts_at).toDateString();
    days.set(key, [...(days.get(key) ?? []), e]);
  }

  return (
    <div className="pt-4">
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-danger-500/40 bg-danger-500/10 p-3 text-[13px] text-danger-500 dark:text-danger-400"
        >
          {error}
        </p>
      )}

      <div className="space-y-7">
        {Array.from(days.entries()).map(([day, list]) => (
          <section key={day}>
            <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-accent-on-soft">
              {dayLabel(day)}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((e) => {
                const kind = EVENT_KINDS.find((k) => k.id === e.kind);
                const pending = e.status === "pending";
                const mine = viewerId && e.host_id === viewerId;
                const full =
                  e.capacity !== null && e.goingCount >= e.capacity;

                return (
                  <article
                    key={e.id}
                    className={[
                      "rounded-card border p-4",
                      pending ? "border-dashed border-flag-500/50" : "border-line",
                    ].join(" ")}
                  >
                    {pending && mine && (
                      <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-flag-500 dark:text-flag-400">
                        <Icon name="clock" size={13} />
                        Waiting for approval
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-on-soft">
                        {kind ? (lang === "es" ? kind.labelEs : kind.label) : e.kind}
                      </span>
                      <span className="text-[13px] font-semibold text-content-muted">
                        {timeLabel(e.starts_at)}
                      </span>
                    </div>

                    <h3 className="mt-2 text-[16px] font-semibold text-content">
                      {e.title}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-content-muted">
                      <Icon name="pin" size={13} />
                      {zoneById(e.zone_id).label}
                      {e.location_note && ` · ${e.location_note}`}
                    </p>

                    {e.description && (
                      <p className="mt-2.5 text-[14px] leading-relaxed text-content-muted">
                        {e.description}
                      </p>
                    )}

                    <p className="mt-3 text-[12px] text-content-faint">
                      Hosted by {e.hostName}
                      {e.goingCount > 0 && ` · ${e.goingCount} going`}
                      {e.capacity !== null && ` · ${e.capacity} places`}
                    </p>

                    <button
                      type="button"
                      onClick={() => toggle(e)}
                      disabled={busy === e.id || (full && e.myRsvp !== "going")}
                      className={[
                        "mt-3 w-full rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-40",
                        e.myRsvp === "going"
                          ? "border border-btn text-btn hover:bg-accent-soft dark:border-brand-500 dark:text-brand-400"
                          : "bg-btn text-btn-fg hover:bg-btn-hover",
                      ].join(" ")}
                    >
                      {busy === e.id
                        ? "…"
                        : e.myRsvp === "going"
                          ? "You're going · tap to cancel"
                          : full
                            ? "Full"
                            : "I'm going"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function dayLabel(dateString: string) {
  const d = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
