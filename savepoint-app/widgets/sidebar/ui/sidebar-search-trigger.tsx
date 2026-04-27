"use client";

import { Search } from "lucide-react";

import { useCommandPaletteContext } from "@/features/command-palette";
import { SidebarMenuButton } from "@/shared/components/ui/sidebar";

export function SidebarSearchTrigger() {
  const { open } = useCommandPaletteContext();

  return (
    <SidebarMenuButton
      onClick={open}
      tooltip="Search (⌘K)"
      aria-label="Open search"
      className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      <span>Search</span>
      <kbd className="ml-auto text-xs opacity-60 group-data-[collapsible=icon]:hidden">
        ⌘K
      </kbd>
    </SidebarMenuButton>
  );
}
