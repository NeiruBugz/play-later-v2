import type { LibraryItem } from "@prisma/client";

export interface LibraryItemCardProps {
  item: LibraryItem;
  onClick?: () => void;
  onDelete?: (itemId: number) => void;
}
