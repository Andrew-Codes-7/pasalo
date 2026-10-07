"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zoneById } from "@/lib/data";
import type { Listing } from "@/lib/types";
import { BottomNav } from "./BottomNav";
import { Icon } from "./Icon";
import { ListingCard } from "./ListingCard";
import { SectionHeader } from "./SectionHeader";
import { ExchangeFilters } from "./ExchangeFilters";
import { useApp } from "./Providers";

/**
 * The browse grid.
 *
 * `real` are listings from the database; `samples` are the built-in demo items.
 * Real ones are shown first and samples appear underneath, clearly labelled —
 * without that separation there is no way to tell whether something you just
 * posted actually saved.
 */
export function BrowseView({
  real,
  samples,
}: {
  real: Listing[];
  samples: Listing[];
}) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-surface" />}>
      <BrowseInner real={real} samples={samples} />
    </Suspense>
  );
}

function BrowseInner({ real, samples }: { real: Listing[]; samples: Listing[] }) {
  const params = useSearchParams();
  const { t } = useApp();

  const cat = params.get("cat");
  const zone = params.get("zone") ?? "all";
  const q = params.get("q") ?? "";

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const test = (l: Listing) => {
      if (cat && l.categoryId !== cat) return false;
      if (zone !== "all" && l.zoneId !== zone) return false;
      if (needle && !l.title.toLowerCase().includes(needle)) return false;
      return true;
    };
    return { real: real.filter(test), samples: samples.filter(test) };
  }, [cat, zone, q, real, samples]);

  const results = [...matches.real, ...matches.samples];
  const freeNow = matches.real.filter((l) => l.priceUsd === null);
  const forSale = matches.real.filter((l) => l.priceUsd !== null);
  const zoneLabel = zone === "all" ? null : zoneById(zone).label;

  return (
    <div className="pb-28 lg:pb-12">
      <SectionHeader
        titleKey="exchangeTitle"
        subKey="exchangeSub"
        below={<ExchangeFilters />}
      />

      <main className="mx-auto max-w-7xl px-4 pt-5">
        <p className="text-sm text-content-muted">
          {t(results.length === 1 ? "itemNearYou" : "itemsNearYou", {
            n: results.length,
          })}
          {zoneLabel && ` · ${zoneLabel}`}
          {q && ` · “${q}”`}
        </p>

        {matches.real.length > 0 && (
          <p className="mt-1 text-[13px] font-medium text-accent-on-soft">
            {matches.real.length} posted by real accounts
          </p>
        )}

        {results.length === 0 && (
          <div className="mt-4 rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
            <p className="font-semibold text-content">{t("nothingHere")}</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-content-muted">
              {t("nothingHereBody")}
            </p>
            <Link
              href="/sell"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-btn px-5 py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
            >
              <Icon name="plus" size={16} />
              {t("postAnItem")}
            </Link>
          </div>
        )}

        {freeNow.length > 0 && (
          <section className="mt-5" aria-labelledby="free-heading">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <h2
                  id="free-heading"
                  className="text-[17px] font-bold tracking-tight text-content lg:text-xl"
                >
                  {t("freeRightNow")}
                </h2>
                <p className="text-[13px] text-content-muted">
                  {t("givenAwayByNeighbors")}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-on-soft">
                <Icon name="gift" size={13} />
                {freeNow.length}
              </span>
            </div>

            <Grid>
              {freeNow.map((l, i) => (
                <ListingCard key={l.id} listing={l} priority={i < 4} />
              ))}
            </Grid>
          </section>
        )}

        {forSale.length > 0 && (
          <section
            className={freeNow.length > 0 ? "mt-9" : "mt-5"}
            aria-labelledby="sale-heading"
          >
            <div className="mb-3">
              <h2
                id="sale-heading"
                className="text-[17px] font-bold tracking-tight text-content lg:text-xl"
              >
                {t("forSaleNearby")}
              </h2>
              <p className="text-[13px] text-content-muted">
                {t("aroundCoco")}
              </p>
            </div>

            <Grid>
              {forSale.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </Grid>
          </section>
        )}
        {matches.samples.length > 0 && real.length < 6 && (
          <section className="mt-10" aria-labelledby="samples-heading">
            <div className="mb-3 border-t border-line pt-6">
              <h2
                id="samples-heading"
                className="text-[17px] font-bold tracking-tight text-content lg:text-xl"
              >
                Example listings
              </h2>
              <p className="text-[13px] text-content-muted">
                Built-in samples so the app isn&apos;t empty. These disappear
                once neighbors are posting for real.
              </p>
            </div>

            <Grid>
              {matches.samples.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </Grid>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}
