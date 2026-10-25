import { useEffect, useState } from "react";
import type { Theme } from "../types";
import { STORAGE_KEYS } from "../lib/constants";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.theme);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch {
      // Use the default if browser storage is unavailable.
    }

    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const resolved = theme === "system"
      ? systemDark ? "dark" : "light"
      : theme;

    root.dataset.theme = resolved;

    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Theme remains active for the current session.
    }
  }, [theme]);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
  }

  return { theme, setTheme };
}