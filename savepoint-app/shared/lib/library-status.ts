import type { LibraryItemStatus } from "@prisma/client";

/**
 * Badge variant type for library status displays
 */
export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

/**
 * Complete status configuration with label, description, and badge variant
 */
export type StatusConfig = {
  value: LibraryItemStatus;
  label: string;
  description: string;
  badgeVariant: StatusBadgeVariant;
};

/**
 * Centralized library status configurations
 *
 * Defines all library item statuses with:
 * - Display labels for UI
 * - Descriptions for tooltips and help text
 * - Badge variants for visual differentiation
 *
 * @example
 * ```tsx
 * import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
 *
 * // Get all statuses for a select dropdown
 * const statusOptions = LIBRARY_STATUS_CONFIG;
 *
 * // Find specific status config
 * const config = LIBRARY_STATUS_CONFIG.find(s => s.value === "CURRENTLY_EXPLORING");
 * console.log(config.label); // "Currently Exploring"
 * console.log(config.badgeVariant); // "default"
 * ```
 */
export const LIBRARY_STATUS_CONFIG: readonly StatusConfig[] = [
  {
    value: "CURIOUS_ABOUT",
    label: "Curious About",
    description: "Interested in trying this game",
    badgeVariant: "outline",
  },
  {
    value: "CURRENTLY_EXPLORING",
    label: "Currently Exploring",
    description: "Actively playing this game",
    badgeVariant: "default",
  },
  {
    value: "TOOK_A_BREAK",
    label: "Taking a Break",
    description: "Paused but plan to return",
    badgeVariant: "secondary",
  },
  {
    value: "EXPERIENCED",
    label: "Experienced",
    description: "Finished or completed this game",
    badgeVariant: "secondary",
  },
  {
    value: "WISHLIST",
    label: "Wishlist",
    description: "Want to play in the future",
    badgeVariant: "outline",
  },
  {
    value: "REVISITING",
    label: "Revisiting",
    description: "Playing again after a break",
    badgeVariant: "default",
  },
] as const;

/**
 * Map of library status values to display labels
 *
 * @example
 * ```tsx
 * const label = LIBRARY_STATUS_LABELS.CURRENTLY_EXPLORING; // "Currently Exploring"
 * ```
 */
export const LIBRARY_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Taking a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};

/**
 * Map of library status values to badge variants
 *
 * Used to determine the visual style of status badges throughout the UI.
 * Provides consistent color coding for status visualization.
 *
 * @example
 * ```tsx
 * const variant = LIBRARY_STATUS_VARIANTS.CURRENTLY_EXPLORING; // "default"
 * <Badge variant={variant}>Currently Exploring</Badge>
 * ```
 */
export const LIBRARY_STATUS_VARIANTS: Record<
  LibraryItemStatus,
  StatusBadgeVariant
> = {
  CURIOUS_ABOUT: "outline",
  CURRENTLY_EXPLORING: "default",
  TOOK_A_BREAK: "secondary",
  EXPERIENCED: "secondary",
  WISHLIST: "outline",
  REVISITING: "default",
};

/**
 * Get display label for a library status
 *
 * @param status - Library item status enum value
 * @returns Human-readable label for the status
 *
 * @example
 * ```tsx
 * const label = getStatusLabel("CURRENTLY_EXPLORING"); // "Currently Exploring"
 * ```
 */
export function getStatusLabel(status: LibraryItemStatus): string {
  return LIBRARY_STATUS_LABELS[status];
}

/**
 * Get badge variant for a library status
 *
 * @param status - Library item status enum value
 * @returns Badge variant for visual styling
 *
 * @example
 * ```tsx
 * const variant = getStatusVariant("CURRENTLY_EXPLORING"); // "default"
 * <Badge variant={variant}>...</Badge>
 * ```
 */
export function getStatusVariant(status: LibraryItemStatus): StatusBadgeVariant {
  return LIBRARY_STATUS_VARIANTS[status];
}
