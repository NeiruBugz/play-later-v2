import type { ResolvedTheme, Theme } from "./theme-provider.type";

/** localStorage key — kept in sync with `next-themes` default (`theme`) so
 * user preferences interop with the canonical Next.js app during the
 * parallel-run window. See DIVERGENCES.md → Slice 19. */
export const THEME_STORAGE_KEY = "theme";

/** The full set of valid theme labels. */
export const THEME_LABELS: readonly Theme[] = [
  "light",
  "dark",
  "cartridge",
  "aurora",
  "system",
] as const;

/**
 * Theme value → CSS class mapping. "" means no theme class is applied.
 * "system" is intentionally absent; it resolves to either "light" or "dark"
 * first. Theme value === CSS class name. Five user-selectable themes per
 * canonical (light/dark/cartridge/aurora/system). The `.y2k` and `.jewel`
 * CSS variants in styles.css are orphan — present in CSS, not reachable
 * from any user-facing surface.
 */
export const THEME_CLASS_MAP: Record<ResolvedTheme, string> = {
  light: "",
  dark: "dark",
  cartridge: "cartridge",
  aurora: "aurora",
};

/** All non-empty class names that this provider may add/remove on <html>. */
export const THEME_CLASS_NAMES: readonly string[] = [
  "dark",
  "cartridge",
  "aurora",
];

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

  // Remove all theme classes we own, then add the resolved one (if any).
  for (const cls of THEME_CLASS_NAMES) {
    root.classList.remove(cls);
  }
  const nextClass = THEME_CLASS_MAP[resolved];
  if (nextClass) {
    root.classList.add(nextClass);
  }

  // data-theme tracks the LABEL (so CSS can key on "cartridge" if it wants),
  // but is omitted when the user is on "system" — matching the inline script.
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
