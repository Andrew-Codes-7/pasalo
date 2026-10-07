"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, ZONES } from "@/lib/data";
import { Icon, type IconName } from "./Icon";
import { useApp } from "./Providers";

const PRIMARY_COUNT = 6;

/**
 * Search, category and area controls for the Exchange tab.
 *
 * Split out of the old marketplace header so it can sit *beneath* the four
 * main tabs rather than replacing them. Previously opening Exchange swapped
 * the whole header out and you lost every way of getting back to the other
 * sections.
 */
export function ExchangeFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, lang } = useApp();

  const activeCat = params.get("cat");
  const activeZone = params.get("zone") ?? "all";
  const activeQuery = params.get("q") ?? "";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function onDown(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  function apply(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || v === "all") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.push(qs ? `/exchange?${qs}` : "/exchange");
  }

  const primary = CATEGORIES.slice(0, PRIMARY_COUNT);
  const overflow = CATEGORIES.slice(PRIMARY_COUNT);
  const label = (c: (typeof CATEGORIES)[number]) =>
    lang === "es" ? c.labelEs : c.label;

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            apply({ q: typeof value === "string" ? value : "" });
          }}
          className="flex min-w-0 flex-1 items-center rounded-full border border-line-strong bg-surface py-1 pl-4 pr-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/12"
        >
          <input
            key={activeQuery}
            name="q"
            defaultValue={activeQuery}
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] text-content placeholder:text-content-faint focus:outline-none"
          />
          <button
            type="submit"
            aria-label={t("searchPlaceholder")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-btn text-btn-fg transition hover:bg-btn-hover"
          >
            <Icon name="search" size={18} strokeWidth={2.2} />
          </button>
        </form>

        <div className="relative shrink-0">
          <Icon
            name="pin"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-400"
          />
          <select
            value={activeZone}
            onChange={(e) => apply({ zone: e.target.value })}
            aria-label={t("allAreas")}
            className="h-full w-[9.5rem] cursor-pointer appearance-none truncate rounded-full border border-line bg-surface py-2 pl-8 pr-6 text-sm font-semibold text-brand-700 focus:border-brand-500 focus:outline-none dark:text-brand-400"
          >
            <option value="all">{t("allAreas")}</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-right"
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-brand-600 dark:text-brand-400"
          />
        </div>
      </div>

      {/* Categories: chips on phones, a row with an overflow menu on desktop */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 lg:hidden">
        <Chip
          label={t("allCategories")}
          icon="grid"
          active={!activeCat}
          onClick={() => apply({ cat: null })}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={label(c) ?? c.label}
            icon={c.icon as IconName}
            active={activeCat === c.id}
            accent={c.id === "free"}
            onClick={() => apply({ cat: c.id })}
          />
        ))}
      </div>

      <div className="hidden items-center gap-1 lg:flex">
        <Chip
          label={t("allCategories")}
          icon="grid"
          active={!activeCat}
          onClick={() => apply({ cat: null })}
        />
        {primary.map((c) => (
          <Chip
            key={c.id}
            label={label(c) ?? c.label}
            icon={c.icon as IconName}
            active={activeCat === c.id}
            accent={c.id === "free"}
            onClick={() => apply({ cat: c.id })}
          />
        ))}

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="flex items-center gap-1 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-content-muted transition hover:border-line-strong hover:text-content"
          >
            {t("more")}
            <Icon
              name="chevron-right"
              size={12}
              className={moreOpen ? "-rotate-90" : "rotate-90"}
            />
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-40 mt-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-lg"
            >
              {overflow.map((c) => (
                <button
                  key={c.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    apply({ cat: c.id });
                    setMoreOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-2 hover:text-content"
                >
                  <Icon name={c.icon as IconName} size={16} />
                  {label(c)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  icon,
  active,
  accent = false,
  onClick,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  accent?: boolean;
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
          : accent
            ? "border-accent-soft-line bg-accent-soft text-accent-on-soft"
            : "border-line bg-surface text-content-muted hover:border-line-strong hover:text-content",
      ].join(" ")}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}
