import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ThemeContext,
  type Theme,
  type ThemeContextValue,
} from "@/shared/lib/theme";

import type { ThemeProviderProps } from "./theme-provider.type";
import {
  applyThemeToHtml,
  getSystemPreference,
  readStoredTheme,
  resolveTheme,
} from "./theme-provider.utility";

/**
 * Hand-rolled theme provider. Replaces `next-themes` for the TanStack Start
 * shell — see DIVERGENCES.md → Slice 19 for rationale (FOUC-script race with
 * RootDocument's inline pre-hydration script).
 *
 * The theme context object and `useTheme` hook live in `@/shared/lib/theme`
 * so that lower-layer slices (e.g. `features/toggle-theme`) can read the
 * current theme without importing from the `app/` layer.
 *
 * Responsibilities:
 *   • Hold the user-chosen `Theme` (incl. "system").
 *   • On mount, resolve from localStorage (key: "theme") with the configured
 *     default as a fallback. Also re-apply to <html> in case the inline
 *     pre-hydration script and the React tree disagree (e.g., after SSR).
 *   • On `setTheme`, persist + imperatively update <html>.
 *   • While the user is on "system", react to OS preference changes via
 *     matchMedia.
 */
export function SavepointThemeProvider({
  children,
  defaultTheme = "system",
  forcedTheme,
}: ThemeProviderProps) {
  const initialTheme: Theme = forcedTheme ?? defaultTheme;

  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // On mount: rehydrate from localStorage (unless forced) and apply to <html>.
  useEffect(() => {
    const next = forcedTheme ?? readStoredTheme(defaultTheme);
    setThemeState(next);
    applyThemeToHtml(next);
    // Mount-only rehydration; later changes flow through `setTheme`.
  }, []);

  // When `forcedTheme` flips at runtime (mostly a test-only knob), honor it.
  useEffect(() => {
    if (forcedTheme === undefined) return;
    setThemeState(forcedTheme);
    applyThemeToHtml(forcedTheme);
  }, [forcedTheme]);

  // While on "system", listen for OS preference changes and re-apply.
  useEffect(() => {
    if (theme !== "system") return;
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyThemeToHtml("system");
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      // forcedTheme wins — the caller asked to lock the value.
      if (forcedTheme !== undefined) return;
      setThemeState(next);
      applyThemeToHtml(next);
      try {
        window.localStorage.setItem("theme", next);
      } catch {
        // Ignore quota / private-mode failures; the in-memory state still
        // updates so the UI stays consistent within this tab.
      }
    },
    [forcedTheme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: resolveTheme(theme),
      setTheme,
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Re-exported so tests / utilities can probe the OS preference without
// reaching into the utility module directly.
export { getSystemPreference };
