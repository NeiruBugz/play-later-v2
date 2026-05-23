import { BookOpen, Plus, type LucideIcon } from "lucide-react";

import { CommandGroup, CommandItem } from "@/shared/ui/command";

import type { PaletteQuickActionsGroupProps } from "./palette-quick-actions-group.type";

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
};

/**
 * Two quick actions, ported from canonical's
 * `savepoint-app/features/command-palette/ui/palette-quick-actions-group.tsx`.
 *
 * Divergence: canonical's "New journal entry" navigates to `/journal/new`,
 * which tanstack doesn't have. We route to `/journal` (the index) and let
 * the user pick "Add entry" there. See DIVERGENCES.md → Slice 17.
 */
export function PaletteQuickActionsGroup({
  query,
  onFocusSearch,
  onNewJournalEntry,
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
      onSelect: onNewJournalEntry,
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
