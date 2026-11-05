import { BookOpen, type LucideIcon } from "lucide-react";

import { CommandGroup, CommandItem } from "@/shared/ui/command";

import type { PaletteQuickActionsGroupProps } from "./palette-quick-actions-group.type";

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
};

export function PaletteQuickActionsGroup({
  query,
  onNewNote,
}: PaletteQuickActionsGroupProps) {
  const actions: QuickAction[] = [
    {
      id: "new-note",
      label: "New note",
      icon: BookOpen,
      onSelect: onNewNote,
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
            <span className="text-sm">{action.label}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
