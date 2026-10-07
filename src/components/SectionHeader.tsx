"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon, type IconName } from "./Icon";
import { AccountMenu } from "./AccountMenu";
import { LangToggle, ThemeToggle } from "./PrefsToggles";
import { useApp } from "./Providers";
import type { StringKey } from "@/lib/i18n";

/**
 * The header every section shares.
 *
 * Deliberately thinner than the old marketplace header: search and category
 * filters were specific to the exchange tab, so they moved there. What stays
 * is what belongs to the whole app — the logo, messages, and your account.
 */
const SECTIONS: { href: string; labelKey: StringKey; icon: IconName }[] = [
  { href: "/", labelKey: "tabHome", icon: "home" },
  { href: "/services", labelKey: "tabServices", icon: "tool" },
  { href: "/exchange", labelKey: "tabExchange", icon: "gift" },
  { href: "/meetups", labelKey: "tabMeetups", icon: "users" },
];

export function SectionHeader({
  titleKey,
  subKey,
  action,
  below,
}: {
  titleKey: StringKey;
  subKey: StringKey;
  action?: React.ReactNode;
  /** Section-specific controls. Rendered beneath the tabs, never instead. */
  below?: React.ReactNode;
}) {
  const { t } = useApp();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-brand-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          aria-label="Home"
        >
          <span className="lg:hidden">
            <Logo height={44} />
          </span>
          <span className="hidden lg:block">
            <Logo height={54} />
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <LangToggle compact />
          </span>
          <ThemeToggle />
          <Link
            href="/messages"
            aria-label={t("messages")}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-content-muted transition hover:border-line-strong hover:text-content"
          >
            <Icon name="message" size={17} />
          </Link>
          <AccountMenu />
        </div>
      </div>

      {/* The four sections, given real weight.
          Full-width equal columns rather than small text links: with only
          four, they can be the most prominent thing in the header, which is
          what makes this read as one app rather than four bolted together. */}
      <nav
        aria-label="Sections"
        className="hidden border-t border-line lg:block"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-4">
          {SECTIONS.map((sec) => {
            const active =
              sec.href === "/"
                ? pathname === "/"
                : pathname.startsWith(sec.href);
            return (
              <Link
                key={sec.href}
                href={sec.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative flex items-center justify-center gap-2.5 px-4 py-4 text-[15px] font-semibold transition",
                  active
                    ? "text-accent-on-soft"
                    : "text-content-muted hover:bg-surface-2 hover:text-content",
                ].join(" ")}
              >
                <Icon name={sec.icon} size={19} />
                {t(sec.labelKey)}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-tight text-content lg:text-2xl">
              {t(titleKey)}
            </h1>
            <p className="mt-0.5 text-sm text-content-muted">{t(subKey)}</p>
          </div>
          {action && <div className="shrink-0 pb-1">{action}</div>}
        </div>
      </div>

      {/* Section-specific controls live here, beneath the tabs — never in
          place of them. Exchange's search and categories used to replace the
          whole header, which stranded you in that tab. */}
      {below && (
        <div className="border-t border-line bg-surface-2/50">
          <div className="mx-auto max-w-7xl px-4 py-3">{below}</div>
        </div>
      )}
    </header>
  );
}
