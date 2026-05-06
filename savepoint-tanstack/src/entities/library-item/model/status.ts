import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export const LIBRARY_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  WISHLIST: "Wishlist",
  SHELF: "Shelf",
  UP_NEXT: "Up Next",
  PLAYING: "Playing",
  PLAYED: "Played",
};

export function getStatusLabel(status: LibraryItemStatus): string {
  return LIBRARY_STATUS_LABELS[status];
}
