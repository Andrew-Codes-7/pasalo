"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useApp } from "./Providers";

/** Floating back control for full-bleed screens like the listing gallery. */
export function BackBar({
  overlay = false,
  title,
  action,
}: {
  overlay?: boolean;
  title?: string;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useApp();

  return (
    <div
      className={[
        "z-30 flex items-center justify-between gap-3 px-4",
        overlay
          ? "absolute inset-x-0 top-0 pt-4"
          : "sticky top-0 border-b border-line bg-surface/95 py-3 backdrop-blur-xl",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={t("goBack")}
        className={[
          "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          overlay
            ? "bg-black/35 text-white backdrop-blur-md hover:bg-black/50"
            : "-ml-2 text-content-muted hover:bg-surface-2 hover:text-content",
        ].join(" ")}
      >
        <Icon name="arrow-left" size={20} />
      </button>

      {title && (
        <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-content">
          {title}
        </h1>
      )}

      <div className="flex shrink-0 items-center gap-2">{action}</div>
    </div>
  );
}
