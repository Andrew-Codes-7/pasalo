"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { useApp } from "./Providers";
import type { StringKey } from "@/lib/i18n";

/**
 * The four sections of the app, plus the post button.
 *
 * Messages and your account live in the header rather than down here — five
 * bottom slots is the limit before they become too small to hit on a phone,
 * and the four sections are what the app is *for*.
 */
const TABS: { href: string; labelKey: StringKey; icon: IconName }[] = [
  { href: "/", labelKey: "tabHome", icon: "home" },
  { href: "/services", labelKey: "tabServices", icon: "tool" },
  { href: "/exchange", labelKey: "tabExchange", icon: "gift" },
  { href: "/meetups", labelKey: "tabMeetups", icon: "users" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useApp();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
    >
      <div className="flex items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        {TABS.slice(0, 2).map((tab) => (
          <NavItem
            key={tab.href}
            href={tab.href}
            label={t(tab.labelKey)}
            icon={tab.icon}
            pathname={pathname}
          />
        ))}

        {/* Posting is the action the app most wants to encourage, so it gets
            the only filled control in the bar. */}
        <Link
          href="/post"
          className="mx-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-btn text-btn-fg shadow-sm transition hover:bg-btn-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          aria-label={t("postSomething")}
        >
          <Icon name="plus" size={22} strokeWidth={2.4} />
        </Link>

        {TABS.slice(2).map((tab) => (
          <NavItem
            key={tab.href}
            href={tab.href}
            label={t(tab.labelKey)}
            icon={tab.icon}
            pathname={pathname}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: IconName;
  pathname: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-w-0 flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        active ? "text-accent-on-soft" : "text-content-muted hover:text-content",
      ].join(" ")}
    >
      <Icon name={icon} size={20} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
