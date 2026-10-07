"use client";

import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { Icon, type IconName } from "@/components/Icon";
import { useApp } from "@/components/Providers";
import { useSession } from "@/lib/useSession";

/**
 * "What are you posting?"
 *
 * With four sections, one plus button has to ask before it can act. Putting
 * the question here keeps a single obvious entry point instead of four
 * separate buttons scattered across the tabs.
 */
export default function PostChooserPage() {
  const { t } = useApp();
  const { profile } = useSession();

  // Hosting is earned, so the option is shown but explained rather than hidden
  // — a locked door you can see is better than one you cannot find.
  const canHost = Boolean(profile?.is_moderator || (profile?.karma ?? 0) >= 200);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16">
      <BackBar title={t("postSomething")} />

      <div className="mt-5 space-y-3">
        <Choice
          href="/sell"
          icon="gift"
          title="Give away or sell something"
          body="A thing you no longer need. Free items earn the most karma."
        />
        <Choice
          href="/post/bulletin"
          icon="megaphone"
          title="Post to the bulletin"
          body="Road closed, water out, lost dog, new business — news the town should know."
        />
        <Choice
          href="/post/service"
          icon="tool"
          title="Add a service"
          body="Yours, or a good electrician you want other neighbors to find."
        />
        <Choice
          href={canHost ? "/post/meetup" : undefined}
          icon="users"
          title="Host a meetup"
          body={
            canHost
              ? "A swap day, a beach cleanup, a game night."
              : `Unlocks at 200 karma. You have ${profile?.karma ?? 0} — give a few things away and you're there.`
          }
          locked={!canHost}
        />
      </div>
    </div>
  );
}

function Choice({
  href,
  icon,
  title,
  body,
  locked = false,
}: {
  href?: string;
  icon: IconName;
  title: string;
  body: string;
  locked?: boolean;
}) {
  const inner = (
    <>
      <span
        className={[
          "grid h-11 w-11 shrink-0 place-items-center rounded-full",
          locked
            ? "bg-surface-2 text-content-faint"
            : "bg-accent-soft text-accent-on-soft",
        ].join(" ")}
      >
        <Icon name={locked ? "shield" : icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-content">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-content-muted">
          {body}
        </span>
      </span>
      {!locked && (
        <Icon
          name="chevron-right"
          size={18}
          className="shrink-0 self-center text-content-faint"
        />
      )}
    </>
  );

  const cls =
    "flex items-start gap-3 rounded-card border border-line p-4 transition";

  if (locked || !href) {
    return <div className={`${cls} opacity-70`}>{inner}</div>;
  }
  return (
    <Link href={href} className={`${cls} hover:border-line-strong`}>
      {inner}
    </Link>
  );
}
