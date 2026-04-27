"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  getStatusLabel,
  LIBRARY_STATUS_CONFIG,
} from "@/shared/lib/library-status";
import type { LibraryItemStatus } from "@/shared/types";

import { useOptimisticLibraryStatus } from "../hooks/use-optimistic-library-status";

export interface LibraryStatusDropdownPillProps {
  currentStatus: LibraryItemStatus | undefined;
  igdbId: number;
}

export function LibraryStatusDropdownPill({
  currentStatus,
  igdbId,
}: LibraryStatusDropdownPillProps) {
  const { optimisticStatus, setStatus } = useOptimisticLibraryStatus(
    igdbId,
    currentStatus
  );

  const label = optimisticStatus
    ? getStatusLabel(optimisticStatus)
    : "Add to Library";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {LIBRARY_STATUS_CONFIG.map((config) => (
          <DropdownMenuItem
            key={config.value}
            onSelect={() => setStatus(config.value)}
            className="gap-2"
            aria-current={
              optimisticStatus === config.value ? "true" : undefined
            }
          >
            <config.icon className="h-4 w-4" aria-hidden="true" />
            {config.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
