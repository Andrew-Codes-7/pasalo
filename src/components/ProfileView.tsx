"use client";

import type { Listing, User } from "@/lib/types";
import {
  CURRENT_USER_ID,
  KARMA_ACTIONS,
  LISTINGS,
  karmaProgress,
  reviewsFor,
  timeAgo,
  userById,
  zoneById,
} from "@/lib/data";
import { Avatar } from "./Avatar";
import { BackBar } from "./BackBar";
import { BottomNav } from "./BottomNav";
import { Icon } from "./Icon";
import { ListingCard } from "./ListingCard";
import { useApp } from "./Providers";

export function ProfileView({
  user,
  listings,
  viewerId,
}: {
  user: User;
  /** Real accounts pass their listings in; samples fall back to lib/data. */
  listings?: Listing[];
  /** Who is looking. Decides what is a storefront and what is account admin. */
  viewerId?: string;
}) {
  const { t, lang } = useApp();

  // Was comparing against the hardcoded sample user, so it was wrong for every
  // real account: your own page treated you as a stranger, complete with a
  // "Report this member" button.
  const isMe = viewerId ? user.id === viewerId : user.id === CURRENT_USER_ID;
  const zone = zoneById(user.zoneId);
  const reviews = reviewsFor(user.id);
  const active = (listings ?? LISTINGS).filter(
    (l) => l.sellerId === user.id && l.status !== "completed",
  );
  const freeItems = active.filter((l) => l.priceUsd === null);
  const saleItems = active.filter((l) => l.priceUsd !== null);
  const { current, next, pct, remaining } = karmaProgress(user.karma);

  const joined = new Date(user.joinedAt).toLocaleDateString(
    lang === "es" ? "es-CR" : "en-US",
    { month: "long", year: "numeric" },
  );

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <BackBar title={isMe ? t("yourProfile") : t("storefront")} />

      <div className="px-4">
        <div className="mt-5 flex items-start gap-4">
          <Avatar user={user} size={72} showVerified />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-content">
              {user.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-content-muted">
              <Icon name="pin" size={14} />
              {zone.label} · {t("joinedIn", { date: joined })}
            </p>
          </div>
        </div>

        {user.bio && (
          <p className="mt-4 text-[15px] leading-relaxed text-content">
            {user.bio}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-3 divide-x divide-line rounded-card border border-line py-4">
          <Stat
            label={t("rating")}
            value={user.reviewCount > 0 ? user.rating.toFixed(1) : "—"}
            sub={t("reviewsCount", { n: user.reviewCount })}
          />
          <Stat
            label={t("givenAway")}
            value={String(user.givenAway)}
            sub={t("items")}
          />
          <Stat
            label={t("repliesIn")}
            value={user.responseMinutes > 0 ? `${user.responseMinutes}m` : "—"}
            sub={t("typically")}
          />
        </dl>

        {/* Karma — the contribution system */}
        <section className="mt-4 rounded-card border border-accent-soft-line bg-accent-soft p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-accent-on-soft">
              <Icon name="spark" size={16} />
              {t(current.labelKey)}
            </h2>
            <span className="text-sm font-bold text-accent-on-soft">
              {user.karma} {t("karma").toLowerCase()}
            </span>
          </div>

          {next ? (
            <>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-surface"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] text-accent-on-soft/80">
                {t("moreToReach", { n: remaining })}{" "}
                <span className="font-semibold">{t(next.labelKey)}</span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-accent-on-soft/80">
              {t("topLevelReached")}
            </p>
          )}

          {isMe && (
            <details className="mt-3 border-t border-accent-soft-line pt-3">
              <summary className="cursor-pointer list-none text-[13px] font-semibold text-accent-on-soft">
                {t("howToEarnKarma")} →
              </summary>
              <ul className="mt-2.5 space-y-1.5">
                {KARMA_ACTIONS.map((a) => (
                  <li
                    key={a.key}
                    className="flex items-center justify-between gap-3 text-[13px] text-accent-on-soft/85"
                  >
                    <span>{t(a.key)}</span>
                    <span className="shrink-0 font-bold">+{a.points}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* Yours is a checklist of things still to do. A visitor gets only the
            badges that were actually earned — the gaps in someone else's
            account are not a stranger's business, and an unchecked list reads
            like a warning rather than the neutral fact it is. */}
        {isMe ? (
          <section className="mt-4 rounded-card border border-line p-4">
            <h2 className="text-sm font-semibold text-content">
              {t("verification")}
            </h2>
            <ul className="mt-3 space-y-2.5">
              <VerifyRow done={user.emailVerified} label={t("emailConfirmed")} />
              <VerifyRow done={user.phoneVerified} label={t("phoneConfirmed")} />
              <VerifyRow
                done={user.neighborVerified}
                label={t("verifiedNeighbor")}
                note={t("verifiedNeighborNote")}
              />
            </ul>
          </section>
        ) : (
          (user.emailVerified || user.phoneVerified || user.neighborVerified) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {user.neighborVerified && (
                <TrustBadge>{t("verifiedNeighbor")}</TrustBadge>
              )}
              {user.emailVerified && (
                <TrustBadge>{t("emailConfirmed")}</TrustBadge>
              )}
              {user.phoneVerified && (
                <TrustBadge>{t("phoneConfirmed")}</TrustBadge>
              )}
            </div>
          )
        )}

        {/* ---- Storefront ----
            Everything this neighbour has on offer, split into giveaways and
            sales. The point is batching: seeing someone has four things means
            one trip instead of four. */}
        <section className="mt-8" id="storefront">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-bold tracking-tight text-content lg:text-xl">
              {isMe
                ? t("yourListings")
                : t("storefrontOf", { name: user.name.split(" ")[0] })}
            </h2>
            {active.length > 0 && (
              <span className="shrink-0 text-sm text-content-muted">
                {t("itemsAvailable", { n: active.length })}
              </span>
            )}
          </div>

          {active.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-strong px-4 py-10 text-center text-sm text-content-muted">
              {isMe ? t("storefrontEmptyMine") : t("storefrontEmpty")}
            </p>
          ) : (
            <>
              {freeItems.length > 0 && (
                <div>
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-accent-on-soft">
                    <Icon name="gift" size={15} />
                    {t("freeRightNow")}
                    <span className="font-normal text-content-faint">
                      {freeItems.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {freeItems.map((l) => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                </div>
              )}

              {saleItems.length > 0 && (
                <div className={freeItems.length > 0 ? "mt-7" : ""}>
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-content">
                    <Icon name="spark" size={15} />
                    {t("forSaleNearby")}
                    <span className="font-normal text-content-faint">
                      {saleItems.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {saleItems.map((l) => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                </div>
              )}

              {active.length > 1 && !isMe && (
                <p className="mt-4 rounded-card bg-accent-soft p-3 text-[13px] leading-snug text-accent-on-soft">
                  {t("batchHint", {
                    n: active.length,
                    name: user.name.split(" ")[0],
                  })}
                </p>
              )}
            </>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-[17px] font-bold tracking-tight text-content">
            {t("reviews")}
            <span className="ml-2 text-sm font-normal text-content-faint">
              {reviews.length}
            </span>
          </h2>

          {reviews.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-strong px-4 py-8 text-center text-sm text-content-muted">
              {t("noReviewsBody")}
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => {
                const author = userById(r.authorId);
                return (
                  <li key={r.id} className="rounded-card border border-line p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar user={author} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-content">
                          {author.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Stars rating={r.rating} />
                          <span className="text-xs text-content-faint">
                            {timeAgo(r.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-content">
                      {r.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {!isMe && (
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-content-muted transition hover:bg-surface-2 hover:text-content"
          >
            <Icon name="flag" size={15} />
            {t("reportMember")}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="px-2 text-center">
      <dt className="text-[11px] uppercase tracking-wide text-content-faint">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-bold text-content">{value}</dd>
      <dd className="text-[11px] text-content-faint">{sub}</dd>
    </div>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-on-soft">
      <Icon name="shield" size={12} strokeWidth={2.4} />
      {children}
    </span>
  );
}

function VerifyRow({
  done,
  label,
  note,
}: {
  done: boolean;
  label: string;
  note?: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={[
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
          done ? "bg-btn text-btn-fg" : "border border-line-strong",
        ].join(" ")}
      >
        {done && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span
          className={[
            "block text-sm",
            done ? "font-medium text-content" : "text-content-faint",
          ].join(" ")}
        >
          {label}
        </span>
        {note && !done && (
          <span className="mt-0.5 block text-xs text-content-faint">{note}</span>
        )}
      </span>
    </li>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5 text-brand-500"
      aria-label={`${rating}/5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name={n <= rating ? "star-filled" : "star"}
          size={12}
          className={n <= rating ? "" : "text-line-strong"}
        />
      ))}
    </span>
  );
}
