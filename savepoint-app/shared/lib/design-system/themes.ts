/**
 * Design System Theme Configuration
 *
 * This file provides JavaScript access to CSS design tokens defined in globals.css.
 * It enables programmatic theme switching and provides type-safe access to design tokens.
 *
 * @see shared/globals.css for the source of truth CSS variables
 */

/**
 * Color tokens - semantic color system
 */
export const colors = {
  // Base colors
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",

  // Surface colors
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },

  // Semantic colors
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  info: {
    DEFAULT: "hsl(var(--info))",
    foreground: "hsl(var(--info-foreground))",
  },

  // Interaction colors
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",

  // Platform brand colors
  platform: {
    nintendo: "var(--color-nintendo)",
    playstation: "var(--color-playstation)",
    xbox: "var(--color-xbox)",
    pc: "var(--color-pc)",
  },

  // Status colors - game journey states
  status: {
    curious: {
      DEFAULT: "var(--status-curious)",
      foreground: "var(--status-curious-foreground)",
    },
    playing: {
      DEFAULT: "var(--status-playing)",
      foreground: "var(--status-playing-foreground)",
    },
    break: {
      DEFAULT: "var(--status-break)",
      foreground: "var(--status-break-foreground)",
    },
    experienced: {
      DEFAULT: "var(--status-experienced)",
      foreground: "var(--status-experienced-foreground)",
    },
    wishlist: {
      DEFAULT: "var(--status-wishlist)",
      foreground: "var(--status-wishlist-foreground)",
    },
    revisiting: {
      DEFAULT: "var(--status-revisiting)",
      foreground: "var(--status-revisiting-foreground)",
    },
  },
} as const;

/**
 * Typography scale - font sizes with line heights and letter spacing
 */
export const typography = {
  display: {
    "2xl": "display-2xl",
    xl: "display-xl",
    lg: "display-lg",
  },
  heading: {
    xl: "heading-xl",
    lg: "heading-lg",
    md: "heading-md",
    sm: "heading-sm",
    xs: "heading-xs",
  },
  subheading: {
    xl: "subheading-xl",
    lg: "subheading-lg",
    md: "subheading-md",
    sm: "subheading-sm",
    xs: "subheading-xs",
  },
  body: {
    lg: "body-lg",
    md: "body-md",
    sm: "body-sm",
    xs: "body-xs",
  },
  caption: "caption",
  overline: "overline",
} as const;

/**
 * Font weights
 */
export const fontWeights = {
  display: "var(--font-weight-display)", // 800
  heading: "var(--font-weight-heading)", // 700
  subheading: "var(--font-weight-subheading)", // 600
  body: "var(--font-weight-body)", // 400
  caption: "var(--font-weight-caption)", // 500
} as const;

/**
 * Spacing scale - semantic spacing values
 */
export const spacing = {
  compact: "var(--space-compact)", // 0.375rem (6px)
  comfortable: "var(--space-comfortable)", // 1rem (16px)
  spacious: "var(--space-spacious)", // 1.5rem (24px)
} as const;

/**
 * Border radius values
 */
export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  pill: "var(--radius-pill)",
} as const;

/**
 * Shadow elevations - paper-like shadows
 */
export const shadows = {
  sm: "var(--shadow-paper-sm)",
  DEFAULT: "var(--shadow-paper)",
  md: "var(--shadow-paper-md)",
  lg: "var(--shadow-paper-lg)",
} as const;

/**
 * Animation durations - Apple-style timing
 */
export const durations = {
  instant: "var(--duration-instant)", // 100ms
  fast: "var(--duration-fast)", // 150ms
  normal: "var(--duration-normal)", // 200ms
  slow: "var(--duration-slow)", // 300ms
  slower: "var(--duration-slower)", // 500ms
} as const;

/**
 * Easing curves - polished, refined motion
 */
export const easings = {
  outExpo: "var(--ease-out-expo)", // Snappy, polished feel
  outBack: "var(--ease-out-back)", // Subtle overshoot
  inOut: "var(--ease-in-out)", // Smooth state changes
} as const;

/**
 * Animation utility classes for consistent motion
 */
export const animations = {
  fadeInUp: "animate-fade-in-up",
  fadeIn: "animate-fade-in",
  scaleIn: "animate-scale-in",
  staggerIn: "animate-stagger-in",
  progressRing: "animate-progress-ring",
  spinSlow: "animate-spin-slow",
  pulseGlow: "animate-pulse-glow",
  shimmer: "animate-shimmer",
} as const;

/**
 * Stagger delay utilities for grid animations
 */
export const staggerDelays = {
  1: "stagger-1",
  2: "stagger-2",
  3: "stagger-3",
  4: "stagger-4",
  5: "stagger-5",
  6: "stagger-6",
  7: "stagger-7",
  8: "stagger-8",
  9: "stagger-9",
  10: "stagger-10",
  11: "stagger-11",
  12: "stagger-12",
} as const;

/**
 * Helper to get stagger class for a given index
 */
export function getStaggerClass(index: number): string {
  const clampedIndex = Math.min(Math.max(index, 1), 12);
  return `stagger-${clampedIndex}`;
}

/**
 * Complete theme object combining all design tokens
 */
export const theme = {
  colors,
  typography,
  fontWeights,
  spacing,
  radius,
  shadows,
  durations,
  easings,
  animations,
  staggerDelays,
} as const;

/**
 * Theme preset definitions for easy switching
 */
export type ThemePreset = "default" | "modern" | "midnight" | "monochrome";

export interface ThemeConfig {
  name: string;
  description: string;
  className: string;
}

export const themePresets: Record<ThemePreset, ThemeConfig> = {
  default: {
    name: "Aged Paper",
    description: "Warm, cozy tones inspired by aged paper and leather-bound books",
    className: "", // Default theme, no class needed
  },
  modern: {
    name: "Modern Clean",
    description: "High-contrast, clean design with crisp edges",
    className: "theme-modern",
  },
  midnight: {
    name: "Midnight",
    description: "Deep dark mode optimized for night reading",
    className: "theme-midnight",
  },
  monochrome: {
    name: "Monochrome",
    description: "Grayscale focus mode for distraction-free experience",
    className: "theme-monochrome",
  },
} as const;

/**
 * Utility function to get CSS variable value at runtime
 */
export function getCSSVariable(variable: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

/**
 * Utility function to set CSS variable value at runtime
 */
export function setCSSVariable(variable: string, value: string): void {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty(variable, value);
}

/**
 * Apply a theme preset to the document
 */
export function applyThemePreset(preset: ThemePreset): void {
  if (typeof window === "undefined") return;

  const config = themePresets[preset];

  // Remove all theme classes
  Object.values(themePresets).forEach((theme) => {
    if (theme.className) {
      document.documentElement.classList.remove(theme.className);
    }
  });

  // Apply new theme class if not default
  if (config.className) {
    document.documentElement.classList.add(config.className);
  }

  // Persist theme choice
  localStorage.setItem("theme-preset", preset);
}

/**
 * Get current theme preset from localStorage
 */
export function getCurrentThemePreset(): ThemePreset {
  if (typeof window === "undefined") return "default";
  return (localStorage.getItem("theme-preset") as ThemePreset) ?? "default";
}

/**
 * Initialize theme from localStorage on app load
 */
export function initializeTheme(): void {
  if (typeof window === "undefined") return;

  const savedPreset = getCurrentThemePreset();
  applyThemePreset(savedPreset);
}
