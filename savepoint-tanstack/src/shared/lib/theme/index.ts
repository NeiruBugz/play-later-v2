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

/**
 * The three theme options (spec 022). "light" applies no CSS class, "dark"
 * applies the `dark` class via the provider's THEME_CLASS_MAP, and "system"
 * resolves to light/dark via matchMedia.
 */
export type Theme = "light" | "dark" | "system";

/**
 * The concrete light/dark surface that may be applied to <html>. "system" is
 * never written here — it resolves to "light" or "dark" via matchMedia.
 */
export type ResolvedTheme = "light" | "dark";

export type ThemeContextValue = {
  /** The user's chosen theme — may include "system". */
  theme: Theme;
  /** The concrete theme actually applied to <html> ("system" resolved). */
  resolvedTheme: ResolvedTheme;
  /** Persist + apply a new theme. */
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

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
