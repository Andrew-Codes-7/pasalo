"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { priceLabel } from "@/lib/data";
import { Icon } from "./Icon";
import { useApp } from "./Providers";
import { sendOffer, startConversation } from "@/lib/conversations";

/**
 * Sticky action bar plus the offer sheet. Offers are a first-class object in
 * this app rather than a chat message — the seller accepts or declines one
 * explicitly, because that acceptance is what later unlocks the review.
 */
export function ListingActions({
  listingTitle,
  priceUsd,
  sellerName,
  listingId,
  sellerId,
}: {
  listingTitle: string;
  priceUsd: number | null;
  sellerName: string;
  /** Omitted for the sample listings, which have nothing to message about. */
  listingId?: string;
  sellerId?: string;
}) {
  const { t } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canAct = Boolean(listingId && sellerId);

  async function openChat() {
    if (!listingId || !sellerId) return;
    setActionError(null);
    setBusy(true);
    try {
      const result = await startConversation(listingId, sellerId);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      router.push(`/messages/${result.conversationId}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOffer() {
    if (!listingId || !sellerId || !amount) return;
    setActionError(null);
    setBusy(true);
    try {
      const convo = await startConversation(listingId, sellerId);
      if (!convo.ok) {
        setActionError(convo.error);
        return;
      }
      const result = await sendOffer(
        convo.conversationId,
        listingId,
        sellerId,
        Number(amount),
      );
      if (!result.ok) {
        setActionError(result.error ?? "Could not send the offer.");
        return;
      }
      setSent(true);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState(
    priceUsd ? String(Math.round(priceUsd * 0.85)) : "",
  );
  const [sent, setSent] = useState(false);

  const isFree = priceUsd === null;
  const price = priceLabel(priceUsd, t("free"));

  return (
    <>
      {/* Pinned to the bottom of the screen on a phone, which is where a
          thumb reaches. On desktop it sits inline in the details column, the
          way every marketplace does it — a floating bar across a wide monitor
          looks like a cookie banner. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:static lg:mt-6 lg:rounded-card lg:border lg:bg-surface lg:p-4 lg:backdrop-blur-none">
        {actionError && (
          <p
            role="alert"
            className="mx-auto mb-2 max-w-2xl text-[13px] text-danger-500 lg:max-w-none dark:text-danger-400"
          >
            {actionError}
          </p>
        )}
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 lg:max-w-none lg:flex-wrap">
          <div className="min-w-0 flex-1 lg:w-full lg:flex-none">
            <p className="text-[11px] font-medium uppercase tracking-wide text-content-faint">
              {isFree ? t("giveaway") : t("asking")}
            </p>
            <p className="truncate text-xl font-bold leading-tight text-content lg:text-3xl">
              {price}
            </p>
          </div>

          {!isFree && (
            <button
              type="button"
              disabled={!canAct || busy}
              onClick={() => setSheetOpen(true)}
              className="rounded-full border border-btn px-5 py-3 text-sm font-semibold text-btn transition hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:flex-1 dark:border-brand-500 dark:text-brand-400"
            >
              {t("makeOffer")}
            </button>
          )}

          <button
            type="button"
            onClick={openChat}
            disabled={!canAct || busy}
            className="flex items-center justify-center gap-2 rounded-full bg-btn px-5 py-3 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-40 lg:flex-1"
          >
            <Icon name="message" size={17} />
            {busy ? "…" : isFree ? t("askForIt") : t("message")}
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-title"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
                  <Icon name="check" size={28} strokeWidth={2.4} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-content">
                  {t("offerSent")}
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  {t("offerSentBody", { name: sellerName })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    setSent(false);
                  }}
                  className="mt-5 w-full rounded-full bg-surface-2 py-3 text-sm font-semibold text-content"
                >
                  {t("done")}
                </button>
              </div>
            ) : (
              <>
                <div
                  className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong sm:hidden"
                  aria-hidden="true"
                />
                <h2 id="offer-title" className="text-lg font-bold text-content">
                  {t("makeAnOffer")}
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  {t("offerSubtitle", { title: listingTitle, price })}
                </p>

                <label
                  htmlFor="offer-amount"
                  className="mt-5 block text-sm font-medium text-content"
                >
                  {t("yourOffer")}
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-content-faint">
                    $
                  </span>
                  <input
                    id="offer-amount"
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface-2 py-3.5 pl-9 pr-4 text-lg font-semibold text-content focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  {priceUsd &&
                    [0.8, 0.9, 1].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() =>
                          setAmount(String(Math.round(priceUsd * mult)))
                        }
                        className="flex-1 rounded-full border border-line py-2 text-sm font-medium text-content-muted transition hover:border-line-strong hover:text-content"
                      >
                        ${Math.round(priceUsd * mult)}
                      </button>
                    ))}
                </div>

                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-[13px] leading-snug text-content-muted">
                  <Icon
                    name="shield"
                    size={15}
                    className="mt-0.5 shrink-0 text-content-faint"
                  />
                  {t("offerSafety")}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="flex-1 rounded-full border border-line py-3 text-sm font-semibold text-content-muted transition hover:bg-surface-2"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={submitOffer}
                    disabled={!amount || busy}
                    className="flex-[2] rounded-full bg-btn py-3 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover disabled:opacity-40"
                  >
                    {t("sendOffer")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
