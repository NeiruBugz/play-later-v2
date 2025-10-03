"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

type ToolbarProps = {
  searchSlot?: ReactNode;
  rightSlot?: ReactNode;
  filtersPanel?: ReactNode;
  resultsText?: string;
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;
};

export function Toolbar({
  searchSlot,
  rightSlot,
  filtersPanel,
  resultsText,
  hasActiveFilters,
  activeFiltersCount = 0,
}: ToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xl flex-1">{searchSlot}</div>
        <div className="flex items-center gap-3">
          {resultsText && (
            <div className="text-sm text-muted-foreground">{resultsText}</div>
          )}
          {rightSlot}
          {filtersPanel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((v) => !v)}
              className="gap-2"
           >
              <SlidersHorizontal className="size-4" />
              Filters
              {hasActiveFilters && activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {open && filtersPanel && (
        <div className="rounded-lg border bg-muted/50 p-4">{filtersPanel}</div>
      )}
    </div>
  );
}

