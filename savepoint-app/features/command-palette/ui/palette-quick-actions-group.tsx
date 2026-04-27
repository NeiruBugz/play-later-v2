"use client";

import { BookOpen, Plus, type LucideIcon } from "lucide-react";

import { CommandGroup, CommandItem } from "@/shared/components/ui/command";

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}

interface PaletteQuickActionsGroupProps {
  query: string;
  onNavigate: (href: string) => void;
  onFocusSearch: () => void;
}

export function PaletteQuickActionsGroup({
  query,
  onNavigate,
  onFocusSearch,
}: PaletteQuickActionsGroupProps) {
  const actions: QuickAction[] = [
    {
      id: "add-game",
      label: "Add game to library",
      icon: Plus,
      onSelect: onFocusSearch,
    },
    {
      id: "new-journal",
      label: "New journal entry",
      icon: BookOpen,
      onSelect: () => onNavigate("/journal/new"),
    },
  ];

  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? actions.filter((a) => a.label.toLowerCase().includes(normalized))
    : actions;

  if (visible.length === 0) return null;

  return (
    <CommandGroup heading="Quick actions">
      {visible.map((action) => {
        const Icon = action.icon;
        return (
          <CommandItem
            key={action.id}
            value={`action-${action.id}`}
            onSelect={action.onSelect}
          >
            <Icon className="text-muted-foreground" aria-hidden />
            <span className="text-body">{action.label}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
