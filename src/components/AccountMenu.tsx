"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useApp } from "./Providers";
import { useSession } from "@/lib/useSession";
import { signOut } from "@/lib/auth";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Signed-out: a link to the login screen.
 * Signed-in: the member's initials, karma, and a way to sign out.
 *
 * Before this existed the header always said "Log in" and pointed at the
 * signup form, so there was no way to tell whether you were signed in and no
 * way to sign out.
 */
export function AccountMenu() {
  const { t } = useApp();
  const { user, profile, loading } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <span className="h-9 w-9 rounded-full bg-surface-2" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-semibold text-content-muted transition hover:text-content"
      >
        {t("logIn")}
      </Link>
    );
  }

  const name = profile?.name ?? "Neighbor";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 transition hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
          {initials(name)}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400">
          <Icon name="spark" size={12} />
          {profile?.karma ?? 0}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-lg"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-content">{name}</p>
            <p className="truncate text-xs text-content-muted">{user.email}</p>
          </div>

          <Link
            href={`/profile/${user.id}`}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-2 hover:text-content"
          >
            <Icon name="user" size={16} />
            {t("profile")}
          </Link>

          {profile?.is_moderator && (
            <Link
              href="/moderate"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-on-soft transition hover:bg-surface-2"
            >
              <Icon name="shield" size={16} />
              Review queue
            </Link>
          )}

          <Link
            href="/sell"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-2 hover:text-content"
          >
            <Icon name="plus" size={16} />
            {t("postAnItem")}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/login");
              router.refresh();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-2 hover:text-content"
          >
            <Icon name="arrow-left" size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
