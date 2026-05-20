import { type PropsWithChildren } from "react";

/**
 * The five named themes from spec 021. Each theme value maps to a same-named
 * CSS class via THEME_CLASS_MAP (e.g. "cartridge" → ".cartridge"), except
 * "light" which applies no class and "system" which resolves to light/dark.
 */
export type Theme = "light" | "dark" | "cartridge" | "aurora" | "system";

/**
 * The concrete CSS class names that may be applied to <html>. "system" is
 * never written here — it resolves to "light" or "dark" via matchMedia.
 */
export type ResolvedTheme = "light" | "dark" | "cartridge" | "aurora";

export type ThemeProviderProps = PropsWithChildren<{
  /** Default theme when nothing is persisted in localStorage. */
  defaultTheme?: Theme;
  /**
   * Optional forced theme for tests / preview surfaces. When set, persistence
   * and matchMedia listeners are still wired but the value is ignored.
   */
  forcedTheme?: Theme;
}>;

export type ThemeContextValue = {
  /** The user's chosen theme — may include "system". */
  theme: Theme;
  /** The concrete theme actually applied to <html> ("system" resolved). */
  resolvedTheme: ResolvedTheme;
  /** Persist + apply a new theme. */
  setTheme: (theme: Theme) => void;
};
