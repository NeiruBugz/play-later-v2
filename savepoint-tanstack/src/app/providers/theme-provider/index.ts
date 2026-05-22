export { SavepointThemeProvider, getSystemPreference } from "./theme-provider";
export type { ThemeProviderProps } from "./theme-provider.type";
// Theme, ResolvedTheme, ThemeContextValue, and useTheme now live in
// @/shared/lib/theme — re-exported here for backward-compat (e.g. tests that
// import from @/app/providers/theme-provider).
export { useTheme } from "@/shared/lib/theme";
export type {
  Theme,
  ResolvedTheme,
  ThemeContextValue,
} from "@/shared/lib/theme";
