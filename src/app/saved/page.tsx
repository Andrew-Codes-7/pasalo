"use client";

import Link from "next/link";
import { LISTINGS } from "@/lib/data";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { useApp } from "@/components/Providers";

/** Sample selection until saves are stored per account. */
const SAVED_IDS = ["l1", "l3", "l6", "l8"];

export default function SavedPage() {
  const { t } = useApp();
  const saved = LISTINGS.filter((l) => SAVED_IDS.includes(l.id));

  return (
    <div className="mx-auto w-full max-w-7xl pb-28">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 px-4 py-4 backdrop-blur-xl">
        <h1 className="text-[22px] font-bold tracking-tight text-content">
          {t("saved")}
        </h1>
        <p className="mt-0.5 text-sm text-content-muted">
          {saved.length} {t("items")}
        </p>
      </header>

      <main className="px-4 pt-4">
        {saved.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-content-faint">
              <Icon name="heart" size={22} />
            </span>
            <p className="mt-3 font-semibold text-content">
              {t("nothingSaved")}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-content-muted">
              {t("nothingSavedBody")}
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-full bg-btn px-5 py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
            >
              {t("browseListings")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {saved.map((l, i) => (
              <ListingCard key={l.id} listing={l} priority={i < 4} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
