"use client";

import { Grid3x3, List } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

import type { ViewToggleProps } from "./view-toggle.types";

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div
      className="bg-muted/30 inline-flex rounded-lg p-1"
      role="group"
      aria-label="View mode"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("list")}
        className={cn(
          "gap-xs px-lg h-8 transition-all",
          view === "list" &&
            "bg-background text-foreground shadow-paper-sm hover:bg-background"
        )}
        aria-pressed={view === "list"}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("grid")}
        className={cn(
          "gap-xs px-lg h-8 transition-all",
          view === "grid" &&
            "bg-background text-foreground shadow-paper-sm hover:bg-background"
        )}
        aria-pressed={view === "grid"}
        aria-label="Grid view"
      >
        <Grid3x3 className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
};
