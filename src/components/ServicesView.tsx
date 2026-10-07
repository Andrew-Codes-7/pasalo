"use client";

import { useMemo, useState } from "react";
import type { ServiceEntry } from "@/lib/fetchCommunity";
import { SERVICE_CATEGORIES, serviceCategory } from "@/lib/communityData";
import { zoneById } from "@/lib/data";
import { Icon, type IconName } from "./Icon";
import { useApp } from "./Providers";
import { EmptySection } from "./EmptySection";

/**
 * The directory: who to call for what.
 *
 * Contact details are shown outright rather than behind a "reveal" tap. This
 * is a list of people who want to be called — hiding a phone number to farm
 * engagement would make the section worse at the one job it has.
 */
export function ServicesView({
  services,
  viewerId,
}: {
  services: ServiceEntry[];
  viewerId?: string;
}) {
  const { lang } = useApp();
  const [category, setCategory] = useState<string | null>(null);

  const shown = useMemo(
    () => (category ? services.filter((s) => s.category_id === category) : services),
    [services, category],
  );

  // Only offer a filter for categories that actually have someone in them.
  const used = useMemo(() => {
    const ids = new Set(services.map((s) => s.category_id));
    return SERVICE_CATEGORIES.filter((c) => ids.has(c.id));
  }, [services]);

  if (services.length === 0) {
    return (
      <EmptySection
        icon="tool"
        title="No providers yet"
        body="Add someone you'd recommend — a plumber, a pool guy, the taxi driver who actually answers."
        ctaLabel="Add a service"
        ctaHref="/post/service"
      />
    );
  }

  return (
    <div className="pt-4">
      {used.length > 1 && (
        <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          <Chip
            label="All"
            icon="grid"
            active={category === null}
            onClick={() => setCategory(null)}
          />
          {used.map((c) => (
            <Chip
              key={c.id}
              label={lang === "es" ? c.labelEs : c.label}
              icon={c.icon as IconName}
              active={category === c.id}
              onClick={() => setCategory(category === c.id ? null : c.id)}
            />
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((s) => (
          <ServiceCard key={s.id} service={s} viewerId={viewerId} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  service: s,
  viewerId,
  lang,
}: {
  service: ServiceEntry;
  viewerId?: string;
  lang: string;
}) {
  const cat = serviceCategory(s.category_id);
  const pending = s.status === "pending";
  const mine = viewerId && (s.created_by === viewerId || s.provider_id === viewerId);

  return (
    <article
      className={[
        "rounded-card border p-4",
        pending ? "border-dashed border-flag-500/50" : "border-line",
      ].join(" ")}
    >
      {pending && mine && (
        <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-flag-500 dark:text-flag-400">
          <Icon name="clock" size={13} />
          Waiting for approval — only you can see this
        </p>
      )}

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
          <Icon name={cat.icon as IconName} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-content">
            {s.name}
          </h3>
          <p className="mt-0.5 text-[13px] text-content-muted">
            {lang === "es" ? cat.labelEs : cat.label}
          </p>
        </div>

        {s.review_count > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-on-soft">
            <Icon name="star-filled" size={12} />
            {s.rating.toFixed(1)}
          </span>
        )}
      </div>

      {s.description && (
        <p className="mt-3 text-[14px] leading-relaxed text-content-muted">
          {s.description}
        </p>
      )}

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {s.rate_note && (
          <div className="flex items-center gap-1.5 text-content-muted">
            <Icon name="spark" size={13} className="text-content-faint" />
            {s.rate_note}
          </div>
        )}
        {s.zones.length > 0 && (
          <div className="flex items-center gap-1.5 text-content-muted">
            <Icon name="pin" size={13} className="text-content-faint" />
            {s.zones.map((z) => zoneById(z).label).join(", ")}
          </div>
        )}
      </dl>

      <p className="mt-2 text-[12px] text-content-faint">
        {s.provider_id ? "Listed by the provider" : "Recommended by a neighbor"}
        {s.review_count > 0 && ` · ${s.review_count} review${s.review_count === 1 ? "" : "s"}`}
      </p>

      {(s.phone || s.whatsapp) && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          {s.phone && (
            <a
              href={`tel:${s.phone.replace(/\s/g, "")}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2.5 text-sm font-semibold text-content transition hover:bg-surface-2"
            >
              <Icon name="user" size={15} />
              Call
            </a>
          )}
          {s.whatsapp && (
            <a
              href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-btn py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
            >
              <Icon name="message" size={15} />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function Chip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-transparent bg-btn text-btn-fg"
          : "border-line text-content-muted hover:border-line-strong hover:text-content",
      ].join(" ")}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}
