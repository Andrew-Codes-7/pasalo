"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { translate, type Lang, type StringKey } from "@/lib/i18n";

type Theme = "light" | "dark";

type AppContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  theme: Theme;
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export const THEME_KEY = "pasalo.theme";
export const LANG_KEY = "pasalo.lang";

/**
 * Theme and language live in the DOM and localStorage — both written by the
 * pre-paint script before React exists. That makes them an *external* store,
 * so they are read through useSyncExternalStore rather than copied into state
 * inside an effect (which causes a second render on every page load).
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  for (const l of listeners) l();
}

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function readLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

// The server has no DOM; these match what the markup is rendered with.
const serverTheme = (): Theme => "light";
const serverLang = (): Lang => "en";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const lang = useSyncExternalStore(subscribe, readLang, serverLang);

  const toggleTheme = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing can refuse writes; the toggle still works for the
      // current page, it just will not be remembered.
    }
    emit();
  }, []);

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      // See above.
    }
    document.documentElement.lang = l;
    emit();
  }, []);

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  return (
    <AppContext.Provider value={{ lang, setLang, t, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <Providers>");
  return ctx;
}

/**
 * Runs before first paint so a dark-mode user never sees a white flash.
 * Falls back to the OS setting when nothing has been chosen yet.
 */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");var l=localStorage.getItem("${LANG_KEY}");if(l)document.documentElement.lang=l;}catch(e){}})();`;
