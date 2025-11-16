"use client";

import { useMemo } from "react";

export type QuickActionsVariant = "badge" | "actionBar";

/**
 * A/B test hook to deterministically assign a quick actions variant based on library item ID
 *
 * Uses a simple hash-based approach to ensure:
 * - Same item always gets the same variant (deterministic)
 * - Approximately 50/50 split across all items
 * - Client-side only (no server-side tracking needed)
 *
 * @param itemId - The library item ID to use as seed
 * @returns 'badge' for interactive badge variant or 'actionBar' for bottom action bar variant
 *
 * @example
 * ```tsx
 * const variant = useQuickActionsVariant(item.id);
 *
 * if (variant === 'badge') {
 *   return <LibraryCardInteractiveBadge />;
 * } else {
 *   return <LibraryCardActionBar />;
 * }
 * ```
 */
export function useQuickActionsVariant(itemId: number): QuickActionsVariant {
  return useMemo(() => {
    // Simple hash function based on item ID
    // This ensures the same item always gets the same variant
    const hash = itemId
      .toString()
      .split("")
      .reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);

    // 50/50 split: even hash = badge, odd hash = actionBar
    return hash % 2 === 0 ? "badge" : "actionBar";
  }, [itemId]);
}
