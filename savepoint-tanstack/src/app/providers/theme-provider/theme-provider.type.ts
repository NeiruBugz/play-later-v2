import { type PropsWithChildren } from "react";

import type { Theme } from "@/shared/lib/theme";

/**
 * Props for `SavepointThemeProvider`. Types for `Theme`, `ResolvedTheme`,
 * and `ThemeContextValue` live in `@/shared/lib/theme` so lower-layer slices
 * can consume them without importing from `app/`.
 */
export type ThemeProviderProps = PropsWithChildren<{
  /** Default theme when nothing is persisted in localStorage. */
  defaultTheme?: Theme;
  /**
   * Optional forced theme for tests / preview surfaces. When set, persistence
   * and matchMedia listeners are still wired but the value is ignored.
   */
  forcedTheme?: Theme;
}>;
