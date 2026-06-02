import type { ResolvedTheme, Theme } from "@/shared/lib/theme";

/** localStorage key — kept in sync with `next-themes` default (`theme`) so
 * user preferences interop with the canonical Next.js app during the
 * parallel-run window. See DIVERGENCES.md → Slice 19. */
export const THEME_STORAGE_KEY = "theme";

/** The full set of valid theme labels. */
export const THEME_LABELS: readonly Theme[] = [
  "light",
  "dark",
  "system",
] as const;

/**
 * Theme value → CSS class mapping. "" means no theme class is applied.
 * "system" is intentionally absent; it resolves to either "light" or "dark"
 * first. The only class this provider ever writes is `dark`.
 */
export const THEME_CLASS_MAP: Record<ResolvedTheme, string> = {
  light: "",
  dark: "dark",
};

/** All non-empty class names that this provider may add/remove on <html>. */
export const THEME_CLASS_NAMES: readonly string[] = ["dark"];

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEME_LABELS.includes(value as Theme);
}

/** Read system preference once. Returns "dark" or "light". Safe in SSR and
 * in test environments where `matchMedia` may be missing — falls back to
 * "light" rather than throwing. */
export function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Resolve "system" → "dark"/"light"; pass through other themes. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return getSystemPreference();
  return theme;
}

/**
 * Imperatively apply a theme to <html>: swap classes, set data-theme, set
 * color-scheme. Mirrors the pre-hydration THEME_INIT_SCRIPT in __root.tsx.
 */
export function applyThemeToHtml(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  for (const cls of THEME_CLASS_NAMES) {
    root.classList.remove(cls);
  }
  const nextClass = THEME_CLASS_MAP[resolved];
  if (nextClass) {
    root.classList.add(nextClass);
  }

  // data-theme tracks the LABEL ("light"/"dark"), but is omitted when the user
  // is on "system" — matching the inline pre-hydration script.
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }

  // color-scheme tracks the RESOLVED theme (light vs dark surface treatment).
  root.style.colorScheme = resolved === "dark" ? "dark" : "light";
}

/** Read the persisted theme, falling back to a default. */
export function readStoredTheme(fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}
