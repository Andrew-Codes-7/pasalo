"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { useApp } from "./Providers";

/**
 * Local-only for the design pass. Once accounts are wired this writes to a
 * `saved_listings` row and the initial state comes from the server.
 */
export function SaveButton({
  initialSaved = false,
  tone = "glass",
  label,
}: {
  initialSaved?: boolean;
  tone?: "glass" | "solid";
  label: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const { t } = useApp();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t("unsave", { title: label }) : t("save", { title: label })}
      onClick={(e) => {
        // The card is a link; keep the tap from navigating.
        e.preventDefault();
        e.stopPropagation();
        setSaved((s) => !s);
      }}
      className={[
        "grid h-9 w-9 place-items-center rounded-full transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        tone === "glass"
          ? "bg-black/30 text-white backdrop-blur-md hover:bg-black/45"
          : "border border-line bg-surface text-content-muted hover:border-line-strong",
        saved && tone === "solid" ? "border-brand-300 text-brand-600" : "",
      ].join(" ")}
    >
      <Icon name={saved ? "heart-filled" : "heart"} size={19} />
    </button>
  );
}
