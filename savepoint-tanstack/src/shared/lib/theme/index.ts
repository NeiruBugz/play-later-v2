/**
 * Theme context, hook, and types extracted to `shared/lib/theme/` so that
 * lower-layer slices (e.g. `features/toggle-theme`) can read the current
 * theme without importing from the `app/` layer.
 *
 * `SavepointThemeProvider` stays in `app/providers/theme-provider/` (the
 * canonical provider mount-point for TanStack Start) and imports this context
 * object. Consumers outside `app/` import `useTheme` from here.
 *
 * FSD: `shared/lib/` is the correct home — it holds cross-cutting utilities
 * reused by 2+ layers (features, widgets). The context itself has no domain
 * logic; it is plain React plumbing.
 */

import { createContext, useContext } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The five named themes from spec 021. Each theme value maps to a same-named
 * CSS class via the provider's THEME_CLASS_MAP, except "light" (no class) and
 * "system" (resolves to light/dark via matchMedia).
 */
export type Theme = "light" | "dark" | "cartridge" | "aurora" | "system";

/**
 * The concrete CSS class names that may be applied to <html>. "system" is
 * never written here — it resolves to "light" or "dark" via matchMedia.
 */
export type ResolvedTheme = "light" | "dark" | "cartridge" | "aurora";

export type ThemeContextValue = {
  /** The user's chosen theme — may include "system". */
  theme: Theme;
  /** The concrete theme actually applied to <html> ("system" resolved). */
  resolvedTheme: ResolvedTheme;
  /** Persist + apply a new theme. */
  setTheme: (theme: Theme) => void;
};

// ── Context ───────────────────────────────────────────────────────────────────

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Hook ─────────────────────────────────────────────────────────────────────

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
