"use client";

import { useMemo } from "react";

export type QuickActionsVariant = "badge" | "actionBar";

export function useQuickActionsVariant(itemId: number): QuickActionsVariant {
  return useMemo(() => {
    const hash = itemId
      .toString()
      .split("")
      .reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);

    return hash % 2 === 0 ? "badge" : "actionBar";
  }, [itemId]);
}
