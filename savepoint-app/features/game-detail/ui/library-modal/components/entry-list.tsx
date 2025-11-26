"use client";

import { Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";
import type { LibraryItemDomain } from "@/shared/types";

import { EntryRow } from "./entry-row";

interface EntryListProps {
  entries: LibraryItemDomain[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAddNew: () => void;
  isAddingNew: boolean;
  className?: string;
}

export function EntryList({
  entries,
  selectedId,
  onSelect,
  onAddNew,
  isAddingNew,
  className,
}: EntryListProps) {
  return (
    <div className={cn("border-border flex flex-col border-r", className)}>
      <div className="p-lg flex-1 overflow-y-auto">
        <p className="text-muted-foreground mb-md px-xs text-xs font-medium tracking-wide uppercase">
          Entries
        </p>
        <div className="space-y-xs" role="listbox" aria-label="Library entries">
          {entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isSelected={entry.id === selectedId && !isAddingNew}
              onClick={() => onSelect(entry.id)}
              className={cn(
                "animate-in fade-in-0 slide-in-from-left-2",
                `[animation-delay:${index * 50}ms]`
              )}
            />
          ))}
        </div>
      </div>

      <div className="border-border p-lg border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onAddNew}
          className={cn(
            "text-muted-foreground gap-md w-full justify-start",
            isAddingNew && "bg-accent text-accent-foreground"
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Platform
        </Button>
      </div>
    </div>
  );
}
