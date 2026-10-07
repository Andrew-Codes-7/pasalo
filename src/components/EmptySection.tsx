"use client";

import Link from "next/link";
import { Icon, type IconName } from "./Icon";

/** Shared empty state, so a quiet section reads as calm rather than broken. */
export function EmptySection({
  icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: IconName;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="mt-4 rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-content-faint">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-3 font-semibold text-content">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-content-muted">{body}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-btn px-5 py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
        >
          <Icon name="plus" size={16} />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
