"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LogoLockup } from "@/components/Logo";
import { LangToggle, ThemeToggle } from "@/components/PrefsToggles";
import { useApp } from "@/components/Providers";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-surface" />}>
      <LoginView />
    </Suspense>
  );
}

/**
 * Signing in for people who already have an account.
 *
 * This screen was missing entirely — the header's "Log in" pointed at the
 * signup form, so returning members were pushed back through registration.
 */
function LoginView() {
  const { t } = useApp();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The confirmation-link handler redirects here when something went wrong.
  const linkProblem = params.get("error");

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="flex items-start justify-between">
        <LogoLockup height={72} />
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <h1 className="mt-10 text-[28px] font-bold tracking-tight text-content">
        {t("signIn")}
      </h1>

      {linkProblem && (
        <p className="mt-4 rounded-2xl border border-flag-500/40 bg-flag-500/10 p-3.5 text-[14px] leading-snug text-flag-500 dark:text-flag-400">
          {linkProblem === "link_expired"
            ? "That confirmation link has already been used or has expired. Sign in below — your account exists."
            : "Something went wrong with that link. Try signing in below."}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-content"
          >
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] text-content focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-content"
          >
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] text-content focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-danger-500/40 bg-danger-500/10 p-3.5 text-[14px] leading-snug text-danger-500 dark:text-danger-400"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-btn py-3.5 text-[15px] font-semibold text-btn-fg transition hover:bg-btn-hover disabled:opacity-50"
      >
        {busy ? "…" : t("signIn")}
        {!busy && <Icon name="arrow-left" size={16} className="rotate-180" />}
      </button>

      <p className="mt-5 text-center text-sm text-content-muted">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/signup"
          className="font-semibold text-brand-700 dark:text-brand-400"
        >
          {t("joinPasalo")}
        </Link>
      </p>
    </div>
  );
}
