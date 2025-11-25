"use client";

import { Plus } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/ui/utils";
import type { LibraryItemDomain } from "@/shared/types";

interface EntryTabsProps {
  entries: LibraryItemDomain[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAddNew: () => void;
  isAddingNew: boolean;
  className?: string;
}

export function EntryTabs({
  entries,
  selectedId,
  onSelect,
  onAddNew,
  isAddingNew,
  className,
}: EntryTabsProps) {
  const activeValue = isAddingNew
    ? "new"
    : selectedId?.toString() ?? entries[0]?.id.toString() ?? "";

  return (
    <Tabs
      value={activeValue}
      onValueChange={(value) => {
        if (value === "new") {
          onAddNew();
        } else {
          onSelect(Number(value));
        }
      }}
      className={className}
    >
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
        {entries.map((entry) => (
          <TabsTrigger
            key={entry.id}
            value={entry.id.toString()}
            className={cn(
              "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
              "rounded-none border-b-2 border-transparent px-md py-sm text-xs sm:px-lg sm:py-md sm:text-sm",
              "data-[state=active]:border-primary",
              "whitespace-nowrap"
            )}
          >
            {entry.platform ?? "Unknown"}
          </TabsTrigger>
        ))}
        <TabsTrigger
          value="new"
          className={cn(
            "text-muted-foreground",
            "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            "rounded-none border-b-2 border-transparent px-md py-sm sm:px-lg sm:py-md",
            "data-[state=active]:border-primary data-[state=active]:text-foreground"
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span className="sr-only">Add new entry</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
