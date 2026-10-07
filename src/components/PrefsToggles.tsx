"use client";

import { useApp } from "./Providers";
import { Icon } from "./Icon";

/** EN / ES switch. Two visible options rather than a dropdown — with only two
 *  languages, showing both is faster and makes the feature discoverable. */
export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useApp();

  return (
    <div
      className="flex items-center rounded-full border border-line p-0.5"
      role="group"
      aria-label={t("language")}
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={[
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition",
            compact ? "px-2" : "",
            lang === l
              ? "bg-btn text-btn-fg"
              : "text-content-muted hover:text-content",
          ].join(" ")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, t } = useApp();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-content-muted transition hover:border-line-strong hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
