"use client";
import { useMemo } from "react";
export type QuickActionsVariant = "badge" | "actionBar";

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
