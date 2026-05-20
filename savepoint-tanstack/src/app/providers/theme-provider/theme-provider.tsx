import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Theme,
  ThemeContextValue,
  ThemeProviderProps,
} from "./theme-provider.type";
import {
  applyThemeToHtml,
  getSystemPreference,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "./theme-provider.utility";

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hand-rolled theme provider. Replaces `next-themes` for the TanStack Start
 * shell — see DIVERGENCES.md → Slice 19 for rationale (FOUC-script race with
 * RootDocument's inline pre-hydration script).
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

  // FSD note: this is a client-side state hook in the `app/` layer — it owns
  // global theme state, which providers (per FSD) are the right home for.
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // On mount: rehydrate from localStorage (unless forced) and apply to <html>.
  // We always re-apply even when the inline pre-hydration script ran, because
  // the React tree may be rendering a forcedTheme or a different default.
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
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
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

/**
 * Read the current theme + setter. Throws if called outside a
 * `<SavepointThemeProvider>` — that's an integration bug, not a UX state.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme() must be used within <SavepointThemeProvider>.");
  }
  return ctx;
}

// Re-exported so tests / utilities can probe the OS preference without
// reaching into the utility module directly.
export { getSystemPreference };
