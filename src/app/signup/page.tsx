"use client";

import Link from "next/link";
import { useState } from "react";
import { ZONES } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { LogoLockup } from "@/components/Logo";
import { LangToggle, ThemeToggle } from "@/components/PrefsToggles";
import { useApp } from "@/components/Providers";
import { checkInviteCode, signUp } from "@/lib/auth";

type Step = "form" | "check-email" | "verified";

/** Costa Rica numbers are 8 digits, US numbers are 10. */
const DIAL_CODES = [
  { code: "+506", label: "🇨🇷 +506", digits: 8 },
  { code: "+1", label: "🇺🇸 +1", digits: 10 },
];

/**
 * Signup is gated twice on purpose. The invite code keeps the community
 * closed while it is small, and the phone requirement (Costa Rica or US only)
 * raises the cost of making throwaway accounts once it opens up. Neither
 * matters until the email is confirmed, which is the middle step.
 */
export default function SignupPage() {
  const { t } = useApp();
  const [step, setStep] = useState<Step>("form");

  const [invite, setInvite] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState(DIAL_CODES[0]);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [zone, setZone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inviteOk = invite.trim().length >= 6;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email);
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === dial.digits;
  const pwOk = password.length >= 10;
  const canSubmit =
    inviteOk && name.trim() && emailOk && phoneOk && pwOk && zone && agreed;

  async function handleSubmit() {
    setTouched(true);
    setSubmitError(null);
    if (!canSubmit) return;

    setBusy(true);
    try {
      // Check the code first so someone with a bad one is told immediately
      // rather than after the account attempt fails. The database enforces it
      // regardless — this is only to give a useful message.
      const codeGood = await checkInviteCode(invite);
      if (!codeGood) {
        setSubmitError(t("inviteCodeError"));
        return;
      }

      const result = await signUp({
        inviteCode: invite,
        name,
        email,
        phone: `${dial.code}${phoneDigits}`,
        password,
        zoneId: zone,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setStep("check-email");
    } catch (e) {
      // Surface the real message. A generic "could not reach the server" hides
      // the useful ones — missing keys, or a dev server started before
      // .env.local existed, both of which say exactly what to do.
      const detail = e instanceof Error ? e.message : String(e);
      console.error("signup failed:", e);
      setSubmitError(detail || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "check-email") {
    return (
      <Centered>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
          <Icon name="send" size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">
          {t("checkEmail")}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-content-muted">
          {t("checkEmailBody", { email })}
        </p>
        <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-[13px] leading-snug text-content-muted">
          {t("checkEmailHint")}
        </p>

        <button
          type="button"
          onClick={() => setStep("verified")}
          className="mt-6 w-full rounded-full bg-btn py-3.5 text-[15px] font-semibold text-btn-fg transition hover:bg-btn-hover"
        >
          {t("confirmedButton")}
        </button>
        <button
          type="button"
          onClick={() => setStep("form")}
          className="mt-2 w-full rounded-full py-3 text-sm font-medium text-content-muted transition hover:bg-surface-2"
        >
          {t("differentAddress")}
        </button>
      </Centered>
    );
  }

  if (step === "verified") {
    return (
      <Centered>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-btn text-btn-fg">
          <Icon name="check" size={30} strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">
          {t("welcomeName", { name: name.split(" ")[0] })}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-content-muted">
          {t("welcomeBody")}
        </p>

        <div className="mt-6 space-y-2.5 text-left">
          <NextStep
            icon="gift"
            title={t("stepGiveTitle")}
            body={t("stepGiveBody")}
            href="/sell"
          />
          <NextStep
            icon="user"
            title={t("stepProfileTitle")}
            body={t("stepProfileBody")}
          />
          <NextStep
            icon="shield"
            title={t("stepVerifiedTitle")}
            body={t("stepVerifiedBody")}
          />
        </div>

        <Link
          href="/"
          className="mt-6 block w-full rounded-full bg-btn py-3.5 text-center text-[15px] font-semibold text-btn-fg transition hover:bg-btn-hover"
        >
          {t("startBrowsing")}
        </Link>
      </Centered>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <LogoLockup height={84} />
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <header className="mt-8">
        <h1 className="text-[28px] font-bold tracking-tight text-content">
          {t("joinPasalo")}
        </h1>
        <p className="mt-1.5 text-[15px] text-content-muted">
          {t("joinSubtitle")}
        </p>
      </header>

      <div className="mt-7 space-y-5">
        <Input
          id="invite"
          label={t("inviteCode")}
          hint={t("inviteCodeHint")}
          value={invite}
          onChange={setInvite}
          error={touched && invite && !inviteOk ? t("inviteCodeError") : undefined}
        />

        <Input
          id="name"
          label={t("yourName")}
          hint={t("nameHint")}
          value={name}
          onChange={setName}
          autoComplete="name"
        />

        <Input
          id="email"
          label={t("email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          error={touched && email && !emailOk ? t("emailError") : undefined}
        />

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-content"
          >
            {t("phone")}
          </label>
          <p className="mt-0.5 text-[13px] text-content-muted">
            {t("phoneHint")}
          </p>
          <div className="mt-2 flex gap-2">
            <select
              aria-label="Country code"
              value={dial.code}
              onChange={(e) =>
                setDial(
                  DIAL_CODES.find((d) => d.code === e.target.value) ??
                    DIAL_CODES[0],
                )
              }
              className="shrink-0 appearance-none rounded-2xl border border-line bg-surface-2 px-3 py-3.5 text-[15px] font-medium text-content focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            >
              {DIAL_CODES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={dial.digits === 8 ? "8888 8888" : "555 123 4567"}
              aria-invalid={touched && Boolean(phone) && !phoneOk}
              className={[
                "min-w-0 flex-1 rounded-2xl border bg-surface-2 px-4 py-3.5 text-[15px] text-content placeholder:text-content-faint",
                "focus:bg-surface focus:outline-none focus:ring-4",
                touched && phone && !phoneOk
                  ? "border-danger-500 focus:ring-danger-500/12"
                  : "border-line focus:border-brand-500 focus:ring-brand-500/12",
              ].join(" ")}
            />
          </div>
          {touched && phone && !phoneOk && (
            <p className="mt-1.5 text-[13px] text-danger-500 dark:text-danger-400">
              {t("phoneError")}
            </p>
          )}
        </div>

        <Input
          id="password"
          label={t("password")}
          type="password"
          hint={t("passwordHint")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={touched && password && !pwOk ? t("passwordError") : undefined}
        />

        <div>
          <label
            htmlFor="zone"
            className="block text-sm font-medium text-content"
          >
            {t("yourArea")}
          </label>
          <p className="mt-0.5 text-[13px] text-content-muted">
            {t("yourAreaHint")}
          </p>
          <select
            id="zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="mt-2 w-full appearance-none rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] text-content focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          >
            <option value="">{t("chooseArea")}</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-2 p-3.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-strong accent-brand-600"
          />
          <span className="text-[13px] leading-snug text-content-muted">
            {t("agreeText")}{" "}
            <span className="font-medium text-brand-700 underline dark:text-brand-400">
              {t("communityRules")}
            </span>
            .
          </span>
        </label>
      </div>

      {submitError && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-danger-500/40 bg-danger-500/10 p-3.5 text-[14px] leading-snug text-danger-500 dark:text-danger-400"
        >
          {submitError}
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={handleSubmit}
        className="mt-7 w-full rounded-full bg-btn py-3.5 text-[15px] font-semibold text-btn-fg transition hover:bg-btn-hover disabled:opacity-50"
      >
        {busy ? "…" : t("createAccount")}
      </button>

      <p className="mt-4 text-center text-sm text-content-muted">
        {t("alreadyMember")}{" "}
        <Link
          href="/"
          className="font-semibold text-brand-700 dark:text-brand-400"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10 text-center">
      {children}
    </div>
  );
}

function Input({
  id,
  label,
  hint,
  value,
  onChange,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-content">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[13px] text-content-muted">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          "mt-2 w-full rounded-2xl border bg-surface-2 px-4 py-3.5 text-[15px] text-content placeholder:text-content-faint",
          "focus:bg-surface focus:outline-none focus:ring-4",
          error
            ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/12"
            : "border-line focus:border-brand-500 focus:ring-brand-500/12",
        ].join(" ")}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-[13px] text-danger-500 dark:text-danger-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function NextStep({
  icon,
  title,
  body,
  href,
}: {
  icon: "gift" | "user" | "shield";
  title: string;
  body: string;
  href?: string;
}) {
  // These cards read as tappable, so the ones that lead somewhere are real
  // links. Rendered as two explicit branches rather than a dynamic component,
  // which Link's prop types reject.
  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-content">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-content-muted">
          {body}
        </span>
      </span>
    </>
  );

  const cls =
    "flex items-start gap-3 rounded-2xl border border-line p-3.5 transition";

  if (href) {
    return (
      <Link href={href} className={`${cls} hover:border-line-strong`}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

