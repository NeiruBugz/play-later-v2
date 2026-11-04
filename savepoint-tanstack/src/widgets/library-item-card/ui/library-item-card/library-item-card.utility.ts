import {
  getStatusEntry,
  type LibraryItemWithGame,
  type StatusBadgeVariant,
} from "@/entities/library-item/model";

type LibraryItemStatus = LibraryItemWithGame["status"];

const COVER_ACCENT_GRADIENT: Record<StatusBadgeVariant, string> = {
  want: "bg-gradient-to-br from-[var(--status-want)] to-background",
  playing: "bg-gradient-to-br from-[var(--status-playing)] to-background",
  done: "bg-gradient-to-br from-[var(--status-done)] to-background",
};

export function getStatusCoverAccent(status: LibraryItemStatus): string {
  return COVER_ACCENT_GRADIENT[getStatusEntry(status).badgeVariant];
}
